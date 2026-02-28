import { API_BASE_URL } from "./api";
import type { AuthUser } from "./auth-store";

async function authFetch<T>(path: string, options: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "Unknown error");
    throw new Error(`${res.status}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export async function registerUser(
  email: string,
  name: string,
  password: string,
  interests: string,
  followers: number,
): Promise<AuthResponse> {
  return authFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, name, password, interests, followers }),
  });
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  return authFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function updateProfile(
  token: string,
  interests: string,
  followers: number,
): Promise<AuthUser> {
  return authFetch<AuthUser>("/api/auth/profile", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ interests, followers }),
  });
}

export interface SavedPost {
  id: number;
  user_id: number;
  title: string;
  content: string;
  reactions: number;
  comments: number;
  created_at: string;
}

export async function savePost(
  token: string,
  title: string,
  content: string,
  reactions: number,
  comments: number,
): Promise<SavedPost> {
  return authFetch<SavedPost>("/api/posts", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title, content, reactions, comments }),
  });
}

export async function fetchUserPosts(token: string): Promise<SavedPost[]> {
  return authFetch<SavedPost[]>("/api/posts", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function exchangeLinkedInCode(
  code: string,
  state: string,
): Promise<{ success: boolean; person_id: string }> {
  return authFetch("/api/auth/linkedin/callback", {
    method: "POST",
    body: JSON.stringify({ code, state }),
  });
}

export async function publishToLinkedIn(
  token: string,
  text: string,
  imageData?: string | null,
): Promise<{ success: boolean; post_id: string; url: string }> {
  return authFetch("/api/linkedin/post", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ text, image_data: imageData ?? null }),
  });
}
