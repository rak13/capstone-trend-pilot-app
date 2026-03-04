// Real API client — replaces mock-data.ts
// All calls go to the FastAPI backend (default: relative URL — proxied by Nginx)

export const API_BASE_URL = (import.meta.env.VITE_API_URL as string) ?? "";

// ── Shared interfaces (same shape as mock-data.ts) ─────────────────────────────

export interface TrendingTopic {
  topic: string;
  trendScore: number;
  topQueries: string[];
  risingQueries: { query: string; value: string }[];
}

export interface PostTitle {
  signal: string;
  title: string;
}

export interface PostVariant {
  hookStyle: string;
  postText: string;
  wordCount: number;
}

export interface EngagementPrediction {
  reactions: number;
  comments: number;
}

export interface VisualResult {
  image_data: string | null;
  content_type: string;
  error: string | null;
}

// ── Internal fetch helper ──────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  body: unknown,
  timeoutMs = 30_000,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`API error ${res.status}: ${detail}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

// ── Step 1: Trending topics ────────────────────────────────────────────────────

interface TrendingTopicRaw {
  topic: string;
  trend_score: number;
  top_queries: string[];
  rising_queries: { query: string; value: string }[];
}

export async function fetchTrendingTopics(
  profileText: string,
  followers: number,
  model = "gpt-5-mini",
): Promise<TrendingTopic[]> {
  const data = await apiFetch<TrendingTopicRaw[]>(
    "/api/trends",
    { profile_text: profileText, followers, model },
    90_000, // slow endpoint — allow up to 90s
  );
  return data.map((d) => ({
    topic:         d.topic,
    trendScore:    d.trend_score,
    topQueries:    d.top_queries,
    risingQueries: d.rising_queries,
  }));
}

// ── Step 2: Post titles ────────────────────────────────────────────────────────

export async function fetchPostTitles(
  trendingTopics: TrendingTopic[],
  profileText: string,
  chosenTopic: string | null,
  model = "gpt-5-mini",
): Promise<PostTitle[]> {
  const body = {
    trending_topics: trendingTopics.map((t) => ({
      topic:          t.topic,
      trend_score:    t.trendScore,
      top_queries:    t.topQueries,
      rising_queries: t.risingQueries,
    })),
    profile_text: profileText,
    chosen_topic: chosenTopic,
    model,
  };
  return apiFetch<PostTitle[]>("/api/post-titles", body, 60_000);
}

// ── Step 3: Post variants ──────────────────────────────────────────────────────

interface PostVariantRaw {
  hook_style: string;
  post_text: string;
  word_count: number;
}

export async function fetchPostVariants(
  postTitle: string,
  profileText: string,
  model = "gpt-5-mini",
): Promise<PostVariant[]> {
  const data = await apiFetch<PostVariantRaw[]>(
    "/api/post-variants",
    { post_title: postTitle, profile_text: profileText, model },
    120_000,
  );
  return data.map((d) => ({
    hookStyle: d.hook_style,
    postText:  d.post_text,
    wordCount: d.word_count,
  }));
}

// ── Step 4: Engagement prediction ─────────────────────────────────────────────

export async function fetchPrediction(
  postText: string,
  followers: number,
  postTitle: string,
): Promise<EngagementPrediction> {
  return apiFetch<EngagementPrediction>(
    "/api/predict",
    { post_text: postText, followers, post_title: postTitle },
    15_000,
  );
}

// ── Step 5 (optional): Refine post with AI instruction ────────────────────────

export async function fetchRefinePost(postText: string, instruction: string, model = "gpt-5-mini"): Promise<string> {
  const data = await apiFetch<{ post_text: string }>(
    "/api/refine-post",
    { post_text: postText, instruction, model },
    60_000,
  );
  return data.post_text;
}

// ── Step 5: Visual generation ──────────────────────────────────────────────────

export async function fetchVisual(postText: string, customPrompt?: string): Promise<VisualResult> {
  const prompt = customPrompt?.trim()
    ? `${postText}\n\nCustom image guide by user:\n${customPrompt.trim()}`
    : postText;
  return apiFetch<VisualResult>("/api/visual", { post_text: prompt }, 150_000);
}
