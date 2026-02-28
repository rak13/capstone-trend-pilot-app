"""
Auth module — SQLite-backed user registration/login + JWT tokens.
"""
from __future__ import annotations

import sqlite3
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

from passlib.context import CryptContext
from jose import JWTError, jwt

# ── Config ──────────────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "trendpilot-secret-change-in-prod-2024")
ALGORITHM  = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

DB_PATH = Path(__file__).parent / "trendpilot.db"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── DB bootstrap ─────────────────────────────────────────────────────────────

def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_conn() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                email       TEXT    UNIQUE NOT NULL,
                name        TEXT    NOT NULL,
                password_hash TEXT  NOT NULL,
                interests   TEXT    DEFAULT '',
                followers   INTEGER DEFAULT 1000,
                created_at  TEXT    DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS posts (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id     INTEGER NOT NULL REFERENCES users(id),
                title       TEXT    DEFAULT '',
                content     TEXT    NOT NULL,
                reactions   INTEGER DEFAULT 0,
                comments    INTEGER DEFAULT 0,
                created_at  TEXT    DEFAULT (datetime('now'))
            );
        """)
        # Migrate: add LinkedIn columns if they don't exist yet
        for col, typedef in [
            ("linkedin_access_token", "TEXT DEFAULT NULL"),
            ("linkedin_person_id",    "TEXT DEFAULT NULL"),
        ]:
            try:
                conn.execute(f"ALTER TABLE users ADD COLUMN {col} {typedef}")
                conn.commit()
            except Exception:
                pass  # column already exists


# ── Password helpers ─────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ── JWT helpers ──────────────────────────────────────────────────────────────

def create_access_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": str(user_id), "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[int]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        return None


# ── User CRUD ────────────────────────────────────────────────────────────────

def create_user(email: str, name: str, password: str, interests: str = "", followers: int = 1000) -> dict:
    with get_conn() as conn:
        try:
            conn.execute(
                "INSERT INTO users (email, name, password_hash, interests, followers) VALUES (?,?,?,?,?)",
                (email.lower().strip(), name.strip(), hash_password(password), interests, followers),
            )
            conn.commit()
        except sqlite3.IntegrityError:
            raise ValueError("Email already registered.")
        row = conn.execute("SELECT * FROM users WHERE email=?", (email.lower().strip(),)).fetchone()
        return dict(row)


def get_user_by_email(email: str) -> Optional[dict]:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM users WHERE email=?", (email.lower().strip(),)).fetchone()
        return dict(row) if row else None


def get_user_by_id(user_id: int) -> Optional[dict]:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
        return dict(row) if row else None


def update_user_profile(user_id: int, interests: str, followers: int) -> dict:
    with get_conn() as conn:
        conn.execute(
            "UPDATE users SET interests=?, followers=? WHERE id=?",
            (interests, followers, user_id),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
        return dict(row)


# ── Post CRUD ────────────────────────────────────────────────────────────────

def save_post(user_id: int, title: str, content: str, reactions: int = 0, comments: int = 0) -> dict:
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO posts (user_id, title, content, reactions, comments) VALUES (?,?,?,?,?)",
            (user_id, title, content, reactions, comments),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM posts WHERE id=?", (cur.lastrowid,)).fetchone()
        return dict(row)


def save_linkedin_token(user_id: int, access_token: str, person_id: str) -> None:
    with get_conn() as conn:
        conn.execute(
            "UPDATE users SET linkedin_access_token=?, linkedin_person_id=? WHERE id=?",
            (access_token, person_id, user_id),
        )
        conn.commit()


def get_linkedin_token(user_id: int) -> tuple[Optional[str], Optional[str]]:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT linkedin_access_token, linkedin_person_id FROM users WHERE id=?",
            (user_id,),
        ).fetchone()
        if row:
            return row[0], row[1]
        return None, None


def get_user_posts(user_id: int) -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM posts WHERE user_id=? ORDER BY created_at DESC",
            (user_id,),
        ).fetchall()
        return [dict(r) for r in rows]
