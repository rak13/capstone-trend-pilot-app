import os
import json
import time
from datetime import datetime, timedelta, timezone

import pandas as pd
from pytrends.request import TrendReq
from openai import OpenAI

# CONFIG
CACHE_FILE = "trend_cache.json"
CACHE_TTL_DAYS = 7
GEO = "US"
TIMEFRAME = "today 3-m"   # last 3 months

client = OpenAI()  # reads OPENAI_API_KEY from env

# GOOGLE TRENDS SETUP
pytrends = TrendReq(hl="en-US", tz=360)

# CACHE HANDLING
def load_cache():
    if not os.path.exists(CACHE_FILE):
        return {}
    with open(CACHE_FILE, "r") as f:
        return json.load(f)

def save_cache(cache):
    with open(CACHE_FILE, "w") as f:
        json.dump(cache, f, indent=2)

def is_cache_valid(entry_timestamp):
    cached_time = datetime.fromisoformat(entry_timestamp)
    return datetime.now(timezone.utc) - cached_time < timedelta(days=CACHE_TTL_DAYS)

# LLM TOPIC EXTRACTION
def extract_topics_llm(profile_text):
    prompt = f"""
You are analyzing a LinkedIn professional bio.

Extract 8–12 specific, post-worthy technical topics suitable for LinkedIn.
Only include:
- Technologies
- Platforms
- Tools
- Frameworks
- Engineering practices

Exclude:
- Job titles
- Generic words (e.g., cloud, data, software)
- Soft skills
- Single generic nouns

Return the result as a comma-separated list.

LinkedIn Bio:
{profile_text}
"""

    response = client.chat.completions.create(
        model="gpt-4o",
        max_tokens=100,
        messages=[{"role": "user", "content": prompt}],
    )

    topics_text = response.choices[0].message.content
    topics = [t.strip() for t in topics_text.split(",") if len(t.strip()) > 2]
    return list(set(topics))  # deduplicate

# GOOGLE TRENDS FETCH
def fetch_trend_data(keyword):
    """Fetch trend score and related queries in a single payload build."""
    pytrends.build_payload([keyword], timeframe=TIMEFRAME, geo=GEO)

    # Trend score
    df = pytrends.interest_over_time()
    score = float(df[keyword].mean()) if (not df.empty and keyword in df.columns) else 0.0

    # Related queries (same payload, no extra build_payload call)
    related = pytrends.related_queries()
    top_queries = []
    rising_queries = []

    if keyword in related and related[keyword] is not None:
        top_df = related[keyword].get("top")
        if top_df is not None and not top_df.empty:
            top_queries = [
                {"query": row["query"], "value": int(row["value"])}
                for _, row in top_df.head(10).iterrows()
            ]

        rising_df = related[keyword].get("rising")
        if rising_df is not None and not rising_df.empty:
            rising_queries = [
                {"query": row["query"], "value": str(row["value"])}
                for _, row in rising_df.head(10).iterrows()
            ]

    return score, top_queries, rising_queries

# TREND SCORING PIPELINE
def get_trending_topics(profile_text):
    cache = load_cache()
    extracted_topics = extract_topics_llm(profile_text)

    results = []

    for topic in extracted_topics:
        cache_entry = cache.get(topic)

        if cache_entry and is_cache_valid(cache_entry["timestamp"]) and cache_entry.get("top_queries") is not None:
            score = cache_entry["score"]
            top_queries = cache_entry.get("top_queries", [])
            rising_queries = cache_entry.get("rising_queries", [])
        else:
            try:
                score, top_queries, rising_queries = fetch_trend_data(topic)
                cache[topic] = {
                    "score": score,
                    "top_queries": top_queries,
                    "rising_queries": rising_queries,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
                time.sleep(2)  # rate-limit safety
            except Exception as e:
                print(f"  [warn] Failed to fetch trends for '{topic}': {e}")
                score = 0.0
                top_queries = []
                rising_queries = []

        results.append({
            "topic": topic,
            "trend_score": score,
            "top_queries": top_queries,
            "rising_queries": rising_queries,
        })

    save_cache(cache)

    df = pd.DataFrame(results)
    df = df.sort_values("trend_score", ascending=False).reset_index(drop=True)
    return df

# LLM POST TOPIC SELECTION
def select_post_topic(trending_df, profile_text, chosen_topic=None):
    if chosen_topic:
        top_topics = trending_df[trending_df["topic"] == chosen_topic].to_dict(orient="records")
    else:
        top_topics = trending_df.head(5).to_dict(orient="records")

    topics_summary_parts = []
    for t in top_topics:
        part = f"- {t['topic']} (trend score: {t['trend_score']:.1f})"

        # Add what people are actually searching for
        top_q = t.get("top_queries", [])
        rising_q = t.get("rising_queries", [])

        if top_q:
            queries_str = ", ".join(q["query"] for q in top_q[:5])
            part += f"\n  People are searching for: {queries_str}"

        if rising_q:
            rising_str = ", ".join(
                f"{q['query']} (+{q['value']}%)" if not isinstance(q['value'], str) else f"{q['query']} (Breakout)"
                for q in rising_q[:5]
            )
            part += f"\n  Rising/breakout searches: {rising_str}"

        topics_summary_parts.append(part)

    topics_summary = "\n".join(topics_summary_parts)

    prompt = f"""You are a LinkedIn content strategist who specializes in timely, high-engagement posts.

Given the following trending topics with their Google Trends data (what people are actually searching for right now), select the 3 BEST rising/breakout search signals and generate one post title per signal.

Trending Topics with Search Data:
{topics_summary}

Professional's Bio:
{profile_text}

CRITICAL RULE — Version numbers and factual accuracy:
- NEVER invent or guess version numbers, release names, or feature names. Your training data may be outdated.
- ONLY mention a specific version/release if it explicitly appears in the search query data above.
- If no version is mentioned in the search data, write the post title WITHOUT a version number. Use phrasing like "latest release", "new update", or focus on the concept/trend instead.
- NEVER fabricate announcements, launches, or features that are not evidenced by the search data.

Instructions:
1. Scan ALL rising/breakout searches across all topics — these are the signals with the highest momentum RIGHT NOW.
2. Pick the 3 MOST DIFFERENT high-momentum search signals (do not pick 3 signals from the same topic — spread across different topics if possible).
3. For each signal, write ONE post title that hooks directly into that specific search trend.
4. Each title MUST name the specific thing people are searching for (a tool, comparison, launch, integration, controversy) — not a generic angle.
5. The post should feel like the author is reacting to something happening NOW, not writing a textbook intro.

BAD examples (too generic, or fabricated versions — avoid these):
- "Unlocking New Potentials: How AWS Transforms Cloud Architecture"
- "Why Kubernetes is the Future of DevOps"
- "OpenShift 4.12: What Its New GitOps Features Mean..." (version not from search data = hallucinated)

GOOD examples (specific, timely, grounded in a real search signal):
- "AWS just launched S3 Express One Zone — here's why it changes the game for latency-sensitive apps"
- "Everyone's comparing GPT-4o vs Claude 3.5 — here's what actually matters for production RAG pipelines"
- "OpenShift's latest update doubles down on GitOps — here's what changed for cloud-native teams"

Respond in this exact format:
SIGNAL 1: <the exact rising search term that inspired this>
POST TITLE 1: <specific, timely post title grounded in signal 1>

SIGNAL 2: <the exact rising search term that inspired this>
POST TITLE 2: <specific, timely post title grounded in signal 2>

SIGNAL 3: <the exact rising search term that inspired this>
POST TITLE 3: <specific, timely post title grounded in signal 3>

REASONING: <2-3 sentences explaining why these 3 signals have the highest momentum right now>
"""

    response = client.chat.completions.create(
        model="gpt-4o",
        max_tokens=600,
        messages=[{"role": "user", "content": prompt}],
    )

    return response.choices[0].message.content.strip()

# DISPLAY HELPERS
def display_top_topics(trending_df, n=5):
    """Display top N trending topics with related queries."""
    top = trending_df.head(n)
    for idx, row in top.iterrows():
        print(f"\n  {idx + 1}. {row['topic']}  (trend score: {row['trend_score']:.1f})")

        top_q = row.get("top_queries", [])
        rising_q = row.get("rising_queries", [])

        if top_q:
            queries_str = ", ".join(q["query"] for q in top_q[:5])
            print(f"     Top searches: {queries_str}")

        if rising_q:
            rising_str = ", ".join(
                f"{q['query']} (+{q['value']}%)" if q['value'] != "Breakout" else f"{q['query']} (Breakout)"
                for q in rising_q[:5]
            )
            print(f"     Rising searches: {rising_str}")


# USAGE
if __name__ == "__main__":
    print("\nEnter LinkedIn profile bio:\n")
    linkedin_bio = input("> ")

    trending_df = get_trending_topics(linkedin_bio)

    while True:
        print("\n--- Top 5 Trending Topics (Profile-Driven) ---")
        display_top_topics(trending_df, n=5)

        print(f"\n  0. Let AI pick the best topic automatically")
        print(f"  q. Quit")
        choice = input("\nChoose a topic number (1-5), 0 for AI pick, or q to quit: ").strip().lower()

        if choice == "q":
            print("\nGoodbye!")
            break

        chosen_topic = None
        if choice.isdigit() and 1 <= int(choice) <= 5:
            chosen_topic = trending_df.iloc[int(choice) - 1]["topic"]
            print(f"\nYou selected: {chosen_topic}")
        else:
            print("\nLetting AI pick the best topic...")

        print("\n--- LLM Recommendation ---\n")
        recommendation = select_post_topic(trending_df, linkedin_bio, chosen_topic=chosen_topic)
        print(recommendation)
