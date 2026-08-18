"use client";

/** Client wrappers for the current user's saved reels. */

export async function fetchSavedReels(): Promise<string[]> {
  const res = await fetch("/api/me/saved-reels", { cache: "no-store" });
  if (!res.ok) return [];
  return ((await res.json()) as { reelIds: string[] }).reelIds ?? [];
}

export async function toggleSavedReel(
  reelId: string,
  save: boolean,
): Promise<string[]> {
  const res = await fetch("/api/me/saved-reels", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reelId, save }),
  });
  if (!res.ok) throw new Error("Could not update saved reels.");
  return ((await res.json()) as { reelIds: string[] }).reelIds ?? [];
}
