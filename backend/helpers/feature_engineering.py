"""
Feature engineering for LinkedIn engagement prediction.
Extracted verbatim from capstone_trend_pilot/streamlit/app.py (Section C).
DO NOT MODIFY the logic here — keep in sync with the Streamlit source.
"""
from __future__ import annotations

import re
import numpy as np

# ── compiled patterns ──────────────────────────────────────────────────────────
_EMOJI_PAT = re.compile(
    r"[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F9FF"
    r"\U0001FA00-\U0001FA9F\U00002600-\U000027BF\U0001F1E0-\U0001F1FF]+",
    flags=re.UNICODE,
)
_URL_PAT = re.compile(r"https?://\S+")

_TOPICS = {
    "tech":         r"\b(technology|ai|software|data|digital|innovation|machine learning|llm|gpt|cloud|api)\b",
    "business":     r"\b(business|marketing|sales|strategy|growth|entrepreneur|startup|revenue|market)\b",
    "career":       r"\b(career|job|hiring|resume|interview|professional|workplace|promotion|salary)\b",
    "leadership":   r"\b(leadership|management|team|leader|ceo|executive|manager|culture)\b",
    "personal_dev": r"\b(learning|skills|development|education|training|course|mindset|habit)\b",
    "finance":      r"\b(finance|investment|money|funding|financial|revenue|profit|equity)\b",
}

_PP_WEIGHTS = {
    "underdog": 9, "transformation": 8, "cta_question": 8, "hidden_truth": 10,
    "vulnerability": 7, "family": 8, "specific_time_content": 6,
    "specific_numbers": 4, "adversity_learning": 5, "value_promise": 4,
    "list_format": 5, "contrast": 5, "aspirational": 6,
    "direct_address": 3, "personal_story": 5,
}


def _length_score(wc: int) -> int:
    if   100 <= wc <= 200: return  8
    elif  80 <= wc <  100: return  5
    elif 200 <  wc <= 300: return  3
    elif  50 <= wc <   80: return -3
    elif wc < 50:          return -12
    else:                  return -15


def _hook_score(first_sent: str) -> tuple[str, int]:
    s = first_sent.lower()
    if re.search(r"\bnever\b.*\b(thought|believed|imagined|expected)", s):
        return "never_narrative", 15
    if re.search(r"\b\d{1,2}:\d{2}\s*(am|pm)?\b", s):
        return "specific_time", 12
    if s.startswith(('"', "'")):
        return "quote_hook", 10
    if re.search(r"\b(stop|start|quit|avoid|never)\s+(doing|using|saying|thinking)", s):
        return "contrarian", 7
    if re.search(r"\bi\s+used\s+to\s+(think|believe|assume)", s):
        return "belief_transformation", 6
    if re.search(r"\b(it'?s official|today|finally|announcing)\b", s):
        return "announcement", 6
    if re.search(r"\beveryone('s| is)\b", s):
        return "everyone_pattern", 5
    if re.search(r"\bjust\s+(realized|learned|discovered|noticed)", s):
        return "realization", 5
    if re.search(r"\b(hours? ago|last (week|month)|yesterday|recently)\b", s):
        return "recency", 4
    return "no_hook", 0


def _power_patterns(text: str) -> tuple[dict, int, int]:
    tl = text.lower()
    flags = {
        "underdog":              int(bool(re.search(r"\b(immigrant|refugee|struggle|overcome|against all odds|bootstrapped|from nothing)\b", tl))),
        "transformation":        int(bool(re.search(r"\b(used to.*now|transformed|changed my life|went from.*to)\b", tl))),
        "cta_question":          int(bool(re.search(r"\b(what do you think|agree or disagree|comment below|share your|thoughts)\?", tl))),
        "hidden_truth":          int(bool(re.search(r"\b(nobody (posts|talks|mentions)|no one (talks|discusses)|hidden truth)\b", tl))),
        "vulnerability":         int(bool(re.search(r"\b(failed|mistake|wrong|scared|afraid|vulnerable|honest|transparent|real talk)\b", tl))),
        "family":                int(bool(re.search(r"\b(daughter|son|kids|children|parent|mom|dad|family|wife|husband)\b", tl))),
        "specific_time_content": int(bool(re.search(r"\b\d{1,2}:\d{2}\s*(am|pm)?\b|\b(morning|afternoon|evening|midnight)\b", tl))),
        "specific_numbers":      int(bool(re.search(r"\b\d+%|\$\d+|\d+x|\d+k\b", tl))),
        "adversity_learning":    int(bool(re.search(r"\b(learned|lesson|taught me|experience|failure|setback)\b", tl))),
        "value_promise":         int(bool(re.search(r"\b(here'?s how|step[s]?:|tip[s]?:|\d+ ways|playbook)\b", tl))),
        "list_format":           int(bool(re.search(r"^\s*[-\u2022*\d][\s.)].+", text, re.MULTILINE))),
        "contrast":              int(bool(re.search(r"\b(but|however|yet|while|instead|rather)\b", tl))),
        "aspirational":          int(bool(re.search(r"\b(dream|vision|future|inspire|achieve|success|goal)\b", tl))),
        "direct_address":        int(bool(re.search(r"\b(you|your|you're|you've)\b", tl))),
        "personal_story":        int(bool(re.search(r"\b(i |my |me |myself )\b", tl))),
    }
    count = sum(flags.values())
    score = sum(_PP_WEIGHTS[k] * v for k, v in flags.items())
    return flags, count, score


def _promo_score(text: str) -> int:
    _HIGH = ["our product", "we built", "we launched", "buy now", "sign up",
             "register now", "limited time", "special offer", "discount"]
    _MED  = ["product", "service", "solution", "demo", "launch", "release",
             "introducing", "platform"]
    tl = text.lower()
    return (sum(2 for kw in _HIGH if kw in tl) +
            sum(1 for kw in _MED if re.search(r"\b" + kw + r"\b", tl)))


def extract_features(post_text: str, followers: int, post_title: str, loo_mean: float) -> dict:
    """Extract ALL features needed for both models at inference time."""
    log_f = np.log1p(followers)

    words = post_text.split()
    wc = len(words)
    sents = re.split(r"[.!?]+", post_text)
    sc = max(1, len(sents))
    lines = post_text.strip().split("\n")
    lc = max(1, len(lines))

    first_line = lines[0] if lines else ""
    first_sent = sents[0].strip() if sents else ""
    hook_type, hook_s = _hook_score(first_sent)

    hashtags = re.findall(r"#\w+", post_text)
    num_ht = len(hashtags)
    ht_bucket = 0 if num_ht == 0 else (1 if num_ht <= 2 else (2 if num_ht <= 5 else (3 if num_ht <= 10 else 4)))

    urls = _URL_PAT.findall(post_text)
    num_links = len(urls)

    emoji_matches = _EMOJI_PAT.findall(post_text)
    emoji_total = sum(len(e) for e in emoji_matches)
    emoji_unique = len(set("".join(emoji_matches)))

    pp_flags, pp_count, pp_score = _power_patterns(post_text)
    promo = _promo_score(post_text)
    lscore = _length_score(wc)

    _pattern_density = 12 if pp_count >= 6 else (7 if pp_count >= 4 else (4 if pp_count == 3 else -7))
    _promo_pen = -12 if promo >= 6 else (-8 if promo >= 4 else (-4 if promo >= 2 else 0))
    link_penalty = -18 if num_links > 0 else 0
    low_effort = int(wc < 80 and num_links > 0 and pp_count < 2)

    base_score = max(0, min(100,
        50 + lscore + hook_s + pp_score + link_penalty +
        _pattern_density + _promo_pen + low_effort * -15
    ))

    has_vuln = pp_flags.get("vulnerability", 0)
    has_cta = int(bool(re.search(
        r"\b(share|comment|follow|like|repost|what do you think|thoughts\?|agree\?)\b",
        post_text, re.I
    )))

    lb = 0 if wc <= 50 else (1 if wc <= 150 else (2 if wc <= 300 else (3 if wc <= 500 else 4)))

    feats = {
        # author
        "log_followers":            log_f,
        "time_spent":               0.0,
        "author_loo_log_mean":      loo_mean,
        "author_post_count":        1,
        # media
        "is_post":                  1,
        "is_article":               0,
        "is_repost":                0,
        "has_video":                0,
        "has_carousel":             0,
        "has_image":                0,
        "has_media":                0,
        "media_score":              0,
        # hashtags
        "num_hashtags":             num_ht,
        "has_hashtags":             int(num_ht > 0),
        "hashtag_bucket":           float(ht_bucket),
        # links
        "num_content_links":        num_links,
        "has_external_link":        int(num_links > 0),
        "link_penalty_score":       link_penalty,
        # text stats
        "char_count":               len(post_text),
        "word_count":               wc,
        "sentence_count":           sc,
        "line_count":               lc,
        "line_break_count":         post_text.count("\n"),
        "avg_word_length":          np.mean([len(w) for w in words]) if words else 0.0,
        "avg_sentence_length":      wc / sc,
        "post_density":             wc / lc,
        "is_long_form":             int(wc > 500),
        "first_line_words":         len(first_line.split()),
        "first_line_short":         int(len(first_line.split()) <= 12),
        "num_exclamations":         post_text.count("!"),
        "num_questions":            post_text.count("?"),
        "has_exclamation":          int(post_text.count("!") > 0),
        "has_question":             int(post_text.count("?") > 0),
        "num_caps_words":           sum(1 for w in words if len(w) > 1 and w.isupper()),
        "num_numbers":              len(re.findall(r"\b\d+\b", post_text)),
        "has_numbers":              int(bool(re.findall(r"\b\d+\b", post_text))),
        "bullet_count":             sum(1 for l in lines if re.match(r"^\s*[-\u2022*]\s", l)),
        "has_bullets":              int(any(re.match(r"^\s*[-\u2022*]\s", l) for l in lines)),
        "has_numbered_list":        int(bool(re.search(r"^\s*\d+[.)]\s", post_text, re.MULTILINE))),
        # style
        "style_quote_marks":        post_text.count('"') + post_text.count("'"),
        "style_has_quotes":         int((post_text.count('"') + post_text.count("'")) >= 2),
        "style_parentheses":        post_text.count("(") + post_text.count(")"),
        "style_has_parentheses":    int((post_text.count("(") + post_text.count(")")) >= 2),
        "mention_count":            len(re.findall(r"@\w+", post_text)),
        "url_in_content":           num_links,
        # emojis
        "emoji_count":              emoji_total,
        "unique_emoji_count":       emoji_unique,
        "has_emoji":                int(emoji_total > 0),
        # diversity + lengths
        "lexical_diversity":        len(set(post_text.lower().split())) / max(1, wc),
        "length_bucket":            float(lb),
        "length_score":             lscore,
        # hooks
        "hook_score":               hook_s,
        "has_announcement_hook":    int(hook_type == "announcement"),
        "has_recency_hook":         int(hook_type == "recency"),
        "has_personal_hook":        int(bool(re.match(r"^(I |After |When |Today |Yesterday |In \d)", post_text.strip()))),
        "starts_with_number":       int(bool(re.match(r"^\s*\d", post_text.strip()))),
        "has_announcement":         int(bool(re.search(r"\b(excited|thrilled|proud|happy|delighted|announcing|announced)\b", post_text, re.I))),
        "has_question_hook":        int(post_text.strip().startswith(("What ", "How ", "Why ", "Who ", "Is ", "Are ", "Do ", "Can "))),
        "has_career_content":       int(bool(re.search(r"\b(job|career|hired|fired|role|position|company|startup|founder|ceo|promotion)\b", post_text, re.I))),
        "has_ai_tech":              int(bool(re.search(r"\b(AI|GPT|LLM|machine learning|deep learning|neural|ChatGPT|artificial intelligence)\b", post_text, re.I))),
        "has_cta":                  has_cta,
        # power patterns
        "power_pattern_count":      pp_count,
        "power_pattern_score":      pp_score,
        "has_underdog":             pp_flags.get("underdog", 0),
        "has_transformation":       pp_flags.get("transformation", 0),
        "has_cta_question":         pp_flags.get("cta_question", 0),
        "has_hidden_truth":         pp_flags.get("hidden_truth", 0),
        "has_vulnerability":        pp_flags.get("vulnerability", 0),
        "has_family":               pp_flags.get("family", 0),
        "has_specific_time_content":pp_flags.get("specific_time_content", 0),
        "has_specific_numbers":     pp_flags.get("specific_numbers", 0),
        "has_adversity_learning":   pp_flags.get("adversity_learning", 0),
        "has_value_promise":        pp_flags.get("value_promise", 0),
        "has_list_format":          pp_flags.get("list_format", 0),
        "has_contrast":             pp_flags.get("contrast", 0),
        "has_aspirational":         pp_flags.get("aspirational", 0),
        "has_direct_address":       pp_flags.get("direct_address", 0),
        "has_personal_story":       pp_flags.get("personal_story", 0),
        "personal_story_score":     int(bool(re.match(r"^(I |After |When |Today |Yesterday |In \d)", post_text.strip()))) + pp_flags.get("vulnerability", 0) + int(bool(re.search(r"\b(excited|thrilled|proud|happy|delighted|announcing|announced)\b", post_text, re.I))),
        # promotional
        "promotional_score":        promo,
        "is_promotional":           int(promo >= 2),
        "is_heavy_promo":           int(promo >= 6),
        "is_low_effort_link":       low_effort,
        # composite
        "base_score":               base_score,
        # topics
        **{f"topic_{t}": int(bool(re.search(p, post_text, re.I))) for t, p in _TOPICS.items()},
        "topic_count":              sum(1 for t, p in _TOPICS.items() if re.search(p, post_text, re.I)),
        "is_multi_topic":           int(sum(1 for t, p in _TOPICS.items() if re.search(p, post_text, re.I)) > 1),
        # headline
        "headline_word_count":      len(post_title.split()) if post_title else 0,
        "headline_has_emoji":       int(bool(_EMOJI_PAT.search(post_title))),
        # interactions
        "log_followers_x_is_post":  log_f * 1,
        "log_followers_x_has_vuln": log_f * has_vuln,
        "log_followers_x_has_cta":  log_f * has_cta,
        "log_followers_x_personal": log_f * int(bool(re.match(r"^(I |After |When |Today |Yesterday |In \d)", post_text.strip()))),
        "loo_x_is_post":            loo_mean * 1,
        "loo_x_has_vuln":           loo_mean * has_vuln,
        "loo_x_word_count":         loo_mean * wc,
        "hook_x_power_score":       hook_s * pp_score,
        "loo_x_base_score":         loo_mean * base_score,
        "sentiment_x_base_score":   0.0,  # no VADER at inference — zero-filled
    }
    return feats
