"use client";

/**
 * Client helpers for student reel contributions: upload the video/thumbnail to
 * Firebase Storage, then create + submit the reel through the approval chain.
 */
import { uploadUserAsset } from "@/lib/firebase/upload-client";
import type { ReelRecord } from "@/lib/content/reelTypes";
import type { CreateReelInput } from "@/lib/validation/reel";

/** Upload a file to reel-uploads/{uid}/… and return its download URL. */
export async function uploadReelAsset(file: File): Promise<string> {
  return uploadUserAsset(file, "reel-uploads");
}

async function parseError(res: Response): Promise<string> {
  const d = (await res.json().catch(() => null)) as { error?: string } | null;
  return d?.error ?? "Request failed. Please try again.";
}

export async function createReelClient(input: CreateReelInput): Promise<string> {
  const res = await fetch("/api/reels", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return ((await res.json()) as { id: string }).id;
}

export async function submitReelClient(id: string): Promise<void> {
  const res = await fetch(`/api/reels/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "submit" }),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function listMyReels(): Promise<ReelRecord[]> {
  const res = await fetch("/api/reels?view=mine", { cache: "no-store" });
  if (!res.ok) return [];
  return ((await res.json()) as { reels: ReelRecord[] }).reels;
}

export async function listReelQueue(): Promise<ReelRecord[]> {
  const res = await fetch("/api/reels?view=queue", { cache: "no-store" });
  if (!res.ok) throw new Error(await parseError(res));
  return ((await res.json()) as { reels: ReelRecord[] }).reels;
}

export async function reelActionClient(
  id: string,
  input: { action: "approve" | "reject" | "archive"; note?: string },
): Promise<ReelRecord> {
  const res = await fetch(`/api/reels/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return ((await res.json()) as { reel: ReelRecord }).reel;
}
