"use client";

/** Typed client wrappers around /api/articles. */
import type { Article } from "@/lib/content/types";
import type {
  CreateArticleInput,
  UpdateArticleInput,
  ReviewActionInput,
} from "@/lib/validation/article";

async function parseError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  return data?.error ?? "Request failed. Please try again.";
}

export async function listArticlesClient(
  view: "mine" | "queue" = "mine",
): Promise<Article[]> {
  const res = await fetch(`/api/articles?view=${view}`, { cache: "no-store" });
  if (!res.ok) throw new Error(await parseError(res));
  return ((await res.json()) as { articles: Article[] }).articles;
}

export async function createArticleClient(
  input: CreateArticleInput,
): Promise<string> {
  const res = await fetch("/api/articles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return ((await res.json()) as { id: string }).id;
}

export async function updateArticleClient(
  id: string,
  patch: UpdateArticleInput,
): Promise<Article> {
  const res = await fetch(`/api/articles/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return ((await res.json()) as { article: Article }).article;
}

export async function articleActionClient(
  id: string,
  input: ReviewActionInput,
): Promise<Article> {
  const res = await fetch(`/api/articles/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return ((await res.json()) as { article: Article }).article;
}

export async function deleteArticleClient(id: string): Promise<void> {
  const res = await fetch(`/api/articles/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await parseError(res));
}
