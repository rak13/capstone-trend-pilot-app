"""
LinkedIn Launchpad — FastAPI Backend
Wraps the existing Python modules without modifying them.
Swagger UI: http://localhost:8000/docs
"""
from __future__ import annotations

import base64
import json
import os
import re
import subprocess
import sys
import warnings
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

import logging

import joblib
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# ── env + paths ────────────────────────────────────────────────────────────────
load_dotenv()  # must happen before any module import that reads env vars at import time

BASE_DIR   = Path(__file__).parent
MODULE_DIR = BASE_DIR / "modules"
ENGMT_DIR  = MODULE_DIR / "engagement_prediction"
VISUAL_DIR = MODULE_DIR / "visual_generation"

# Ensure trend_cache.json is written to backend/ regardless of launch CWD
os.chdir(BASE_DIR)

sys.path.insert(0, str(MODULE_DIR))
sys.path.insert(0, str(BASE_DIR))

# ── module imports (after load_dotenv + chdir) ─────────────────────────────────
from trend_identification_v2 import get_trending_topics, select_post_topic  # noqa: E402
from helpers.feature_engineering import extract_features  # noqa: E402
from openai import OpenAI  # noqa: E402
import auth as _auth  # noqa: E402

# ── model globals ──────────────────────────────────────────────────────────────
mdl_r = mdl_c = feat_r = feat_c = loo_r = loo_c = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global mdl_r, mdl_c, feat_r, feat_c, loo_r, loo_c
    _auth.init_db()  # bootstrap SQLite tables
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        mdl_r = joblib.load(ENGMT_DIR / "hgbr_reactions.pkl")
        mdl_c = joblib.load(ENGMT_DIR / "hgbr_comments.pkl")
    feat_r = json.loads((ENGMT_DIR / "feature_names_reactions.json").read_text())
    feat_c = json.loads((ENGMT_DIR / "feature_names_comments.json").read_text())
    loo_r  = json.loads((ENGMT_DIR / "loo_stats_reactions.json").read_text())
    loo_c  = json.loads((ENGMT_DIR / "loo_stats_comments.json").read_text())
    yield


# ── app + CORS ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="LinkedIn Launchpad API",
    description="Backend API for the LinkedIn Launchpad wizard.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic schemas ───────────────────────────────────────────────────────────

class TrendsRequest(BaseModel):
    profile_text: str
    followers: int = 1000


class RisingQuery(BaseModel):
    query: str
    value: str


class TrendingTopicIn(BaseModel):
    topic: str
    trend_score: float
    top_queries: list[str]
    rising_queries: list[RisingQuery]


class PostTitlesRequest(BaseModel):
    trending_topics: list[TrendingTopicIn]
    profile_text: str
    chosen_topic: Optional[str] = None


class PostVariantsRequest(BaseModel):
    post_title: str
    profile_text: str


class PredictRequest(BaseModel):
    post_text: str
    followers: int
    post_title: str = ""


class VisualRequest(BaseModel):
    post_text: str


class RefinePostRequest(BaseModel):
    post_text: str
    instruction: str


# ── Auth schemas ───────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str
    name: str
    password: str
    interests: str = ""
    followers: int = 1000


class LoginRequest(BaseModel):
    email: str
    password: str


class UpdateProfileRequest(BaseModel):
    interests: str
    followers: int


class SavePostRequest(BaseModel):
    title: str = ""
    content: str
    reactions: int = 0
    comments: int = 0


# ── inline helpers (copied/adapted from app.py) ────────────────────────────────

def parse_post_titles(llm_output: str) -> list[dict]:
    """Parse LLM output into [{signal, title}] list."""
    titles = []
    for i in range(1, 4):
        signal_match = re.search(rf"SIGNAL\s+{i}:\s*(.+)", llm_output, re.IGNORECASE)
        title_match  = re.search(rf"POST\s+TITLE\s+{i}:\s*(.+)", llm_output, re.IGNORECASE)
        if title_match:
            titles.append({
                "signal": signal_match.group(1).strip() if signal_match else "",
                "title":  title_match.group(1).strip(),
            })
    return titles


MASTER_SYSTEM_PROMPT = """
You are an expert LinkedIn content strategist and copywriter.

Your goal is to generate authentic, high-engagement LinkedIn posts
that maximize reach and interaction while avoiding promotional suppression.

Optimize for:
- Authentic storytelling over promotion
- Strong first-sentence hooks
- Specific details (numbers, moments, experiences)
- Personal insights or transformations

Hard constraints:
- Target length: 100–200 words
- NO external links
- Minimal promotional language
- Tone: human, reflective, conversational
- Platform: LinkedIn (B2B audience)
- Add relevant hashtags in the last line

Output should feel like a real professional sharing a genuine insight.
"""

HOOK_STYLES = [
    "Contrarian — challenge a common assumption in the field",
    "Personal transformation — 'I used to believe X, now I know Y'",
    "Hidden insight — something that most people overlook",
]


def _build_user_prompt(topic: str, profile_context: str, hook_style: str) -> str:
    return f"""
Create a high-performing LinkedIn post using the following inputs.

Topic:
{topic}

Core personal context (author's background):
{profile_context}

Hook preference:
{hook_style}

Constraints:
- 100–200 words
- No external links
- No promotional language
- Short paragraphs (2–3 sentences max per paragraph)
- End with a thought-provoking question to drive comments
"""


def _do_predict(post_text: str, followers: int, post_title: str) -> dict:
    global_loo_r = loo_r["global_log_mean"]
    global_loo_c = loo_c["global_log_mean"]

    feats_r = extract_features(post_text, followers, post_title, global_loo_r)
    feats_c = extract_features(post_text, followers, post_title, global_loo_c)

    row_r = np.array([[feats_r.get(f, 0.0) for f in feat_r]])
    row_c = np.array([[feats_c.get(f, 0.0) for f in feat_c]])

    pred_r = float(np.expm1(mdl_r.predict(row_r)[0]))
    pred_c = float(np.expm1(mdl_c.predict(row_c)[0]))

    return {
        "reactions": max(0, round(pred_r)),
        "comments":  max(0, round(pred_c)),
    }


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.get("/", tags=["health"])
def health():
    return {"status": "ok", "service": "LinkedIn Launchpad API"}


@app.post("/api/trends", tags=["trends"])
def trends(req: TrendsRequest):
    """
    Step 1 — Extract trending topics from a LinkedIn bio.
    Calls Google Trends + GPT-4o. Expect 20-60s response time.
    """
    try:
        df = get_trending_topics(req.profile_text)
    except Exception as e:
        logger.exception("Trend analysis failed")
        raise HTTPException(status_code=500, detail=f"Trend analysis failed: {e}")

    topics = []
    for _, row in df.iterrows():
        raw_tq = row.get("top_queries", []) or []
        raw_rq = row.get("rising_queries", []) or []

        # top_queries: list of {"query": str, "value": int} → flatten to str list
        top_q = [q["query"] if isinstance(q, dict) else str(q) for q in raw_tq]

        # rising_queries: list of {"query": str, "value": str/int}
        rising_q = [
            {"query": q["query"], "value": str(q["value"])}
            if isinstance(q, dict) else {"query": str(q), "value": ""}
            for q in raw_rq
        ]

        topics.append({
            "topic":         str(row["topic"]),
            "trend_score":   float(row["trend_score"]),
            "top_queries":   top_q,
            "rising_queries": rising_q,
        })
    return topics


@app.post("/api/post-titles", tags=["posts"])
def post_titles(req: PostTitlesRequest):
    """
    Step 2 — Generate 3 post title recommendations from trending topics.
    Uses GPT-4o to select high-momentum signals and craft titles.
    """
    # Rebuild DataFrame expected by select_post_topic
    records = []
    for t in req.trending_topics:
        records.append({
            "topic":          t.topic,
            "trend_score":    t.trend_score,
            "top_queries":    [{"query": q, "value": 0} for q in t.top_queries],
            "rising_queries": [{"query": rq.query, "value": rq.value} for rq in t.rising_queries],
        })
    df = pd.DataFrame(records)

    try:
        raw = select_post_topic(df, req.profile_text, chosen_topic=req.chosen_topic)
    except Exception as e:
        logger.exception("Title generation failed")
        raise HTTPException(status_code=500, detail=f"Title generation failed: {e}")

    parsed = parse_post_titles(raw)
    if not parsed:
        raise HTTPException(status_code=500, detail=f"Could not parse LLM output:\n{raw}")
    return parsed


@app.post("/api/post-variants", tags=["posts"])
def post_variants(req: PostVariantsRequest):
    """
    Step 3 — Generate 3 post variants with different hook styles.
    Uses GPT-4o-mini.
    """
    client = OpenAI()
    variants = []
    for hook in HOOK_STYLES:
        prompt = _build_user_prompt(req.post_title, req.profile_text, hook)
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": MASTER_SYSTEM_PROMPT},
                    {"role": "user",   "content": prompt},
                ],
                temperature=0.75,
            )
        except Exception as e:
            logger.exception("Post generation failed")
            raise HTTPException(status_code=500, detail=f"Post generation failed: {e}")

        text = response.choices[0].message.content.strip()
        variants.append({
            "hook_style": hook.split("—")[0].strip(),
            "post_text":  text,
            "word_count": len(text.split()),
        })
    return variants


@app.post("/api/predict", tags=["engagement"])
def predict(req: PredictRequest):
    """
    Step 4 — Predict reactions and comments for a post.
    Uses the HGBR engagement prediction models (loaded at startup).
    """
    if mdl_r is None:
        raise HTTPException(status_code=503, detail="Models not loaded yet")
    try:
        return _do_predict(req.post_text, req.followers, req.post_title)
    except Exception as e:
        logger.exception("Prediction failed")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")


@app.post("/api/refine-post", tags=["posts"])
def refine_post(req: RefinePostRequest):
    """
    Step 5 (optional) — Refine an existing post with a user instruction.
    Preserves tone, topic, and LinkedIn constraints while applying the requested change.
    """
    client = OpenAI()
    system = (
        MASTER_SYSTEM_PROMPT
        + "\n\nYou will receive an existing LinkedIn post and an instruction from the user. "
        "Apply the instruction to revise the post while preserving the original voice, topic, "
        "and all LinkedIn constraints. Return only the revised post text — no commentary."
    )
    user_prompt = f"Existing post:\n{req.post_text}\n\nInstruction:\n{req.instruction}"
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system},
                {"role": "user",   "content": user_prompt},
            ],
            temperature=0.7,
        )
    except Exception as e:
        logger.exception("Post refinement failed")
        raise HTTPException(status_code=500, detail=f"Post refinement failed: {e}")
    return {"post_text": response.choices[0].message.content.strip()}


@app.post("/api/visual", tags=["visual"])
def visual(req: VisualRequest):
    """
    Step 5 — Generate a diagram or image for a post.
    Returns a base64-encoded PNG. The generated file is deleted after encoding.
    Requires Ollama (local LLM) and either Graphviz or Stable Diffusion.
    """
    script      = str(VISUAL_DIR / "service" / "visual_service.py")
    service_cwd = str(VISUAL_DIR / "service")

    try:
        result = subprocess.run(
            [sys.executable, script, req.post_text],
            capture_output=True,
            text=True,
            cwd=service_cwd,
            timeout=120,
        )
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Visual service timed out after 120s")
    except Exception as e:
        logger.exception("Visual service error")
        raise HTTPException(status_code=500, detail=f"Visual service error: {e}")

    stdout = result.stdout.strip()
    stderr = result.stderr.strip()

    if not stdout:
        raise HTTPException(
            status_code=500,
            detail=f"Visual service produced no output.\n{stderr}",
        )

    # Find last JSON line in stdout
    last_json = next(
        (line for line in reversed(stdout.splitlines()) if line.strip().startswith("{")),
        None,
    )
    if not last_json:
        raise HTTPException(
            status_code=500,
            detail=f"No JSON in visual service output:\n{stdout}",
        )

    try:
        data = json.loads(last_json)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Could not parse visual service JSON: {e}")

    if "error" in data:
        return {"image_data": None, "content_type": "image/png", "error": data["error"]}

    if data.get("type") == "none":
        return {"image_data": None, "content_type": "image/png", "error": "No visual generated for this content"}

    image_path = data.get("path", "")
    if not image_path or not os.path.exists(image_path):
        return {"image_data": None, "content_type": "image/png", "error": f"Image file not found: {image_path}"}

    # Read, base64 encode, delete
    try:
        with open(image_path, "rb") as f:
            raw_bytes = f.read()
        encoded = base64.b64encode(raw_bytes).decode("utf-8")
    except Exception as e:
        logger.exception("Failed to read image file")
        raise HTTPException(status_code=500, detail=f"Failed to read image file: {e}")
    finally:
        try:
            os.remove(image_path)
        except Exception:
            pass  # best-effort cleanup

    return {"image_data": encoded, "content_type": "image/png", "error": None}


# ── Auth helpers ────────────────────────────────────────────────────────────────

_bearer = HTTPBearer(auto_error=False)


def _current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(_bearer)) -> dict:
    if not creds:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = _auth.decode_token(creds.credentials)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = _auth.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def _safe_user(u: dict) -> dict:
    """Strip password hash before returning to client."""
    return {k: v for k, v in u.items() if k != "password_hash"}


# ── Auth routes ─────────────────────────────────────────────────────────────────

@app.post("/api/auth/register", tags=["auth"])
def register(req: RegisterRequest):
    """Register a new user. Returns JWT token."""
    if not req.email or not req.name or not req.password:
        raise HTTPException(status_code=400, detail="Email, name, and password are required.")
    try:
        user = _auth.create_user(
            email=req.email,
            name=req.name,
            password=req.password,
            interests=req.interests,
            followers=req.followers,
        )
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    token = _auth.create_access_token(user["id"])
    return {"token": token, "user": _safe_user(user)}


@app.post("/api/auth/login", tags=["auth"])
def login(req: LoginRequest):
    """Login with email + password. Returns JWT token."""
    user = _auth.get_user_by_email(req.email)
    if not user or not _auth.verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    token = _auth.create_access_token(user["id"])
    return {"token": token, "user": _safe_user(user)}


@app.get("/api/auth/me", tags=["auth"])
def me(current_user: dict = Depends(_current_user)):
    """Return the currently authenticated user's profile."""
    return _safe_user(current_user)


@app.put("/api/auth/profile", tags=["auth"])
def update_profile(req: UpdateProfileRequest, current_user: dict = Depends(_current_user)):
    """Update interests and followers for the authenticated user."""
    updated = _auth.update_user_profile(current_user["id"], req.interests, req.followers)
    return _safe_user(updated)


# ── Post history routes ─────────────────────────────────────────────────────────

@app.post("/api/posts", tags=["posts"])
def create_post(req: SavePostRequest, current_user: dict = Depends(_current_user)):
    """Save a completed post to the authenticated user's history."""
    post = _auth.save_post(
        user_id=current_user["id"],
        title=req.title,
        content=req.content,
        reactions=req.reactions,
        comments=req.comments,
    )
    return post


@app.get("/api/posts", tags=["posts"])
def list_posts(current_user: dict = Depends(_current_user)):
    """Return all posts created by the authenticated user, newest first."""
    return _auth.get_user_posts(current_user["id"])
