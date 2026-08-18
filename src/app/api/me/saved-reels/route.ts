/**
 * /api/me/saved-reels
 *   GET  — the current user's saved reel ids.
 *   POST — { reelId, save } toggle a saved reel.
 * Requires an authenticated, ACTIVE user (saving is a per-account action).
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth/api-guard";
import { getSavedReels, setReelSaved } from "@/lib/firebase/users";

export async function GET() {
  const guard = await requireApiUser();
  if (guard instanceof NextResponse) return guard;
  return NextResponse.json({ reelIds: await getSavedReels(guard.user.uid) });
}

const bodySchema = z.object({
  reelId: z.string().trim().min(1),
  save: z.boolean(),
});

export async function POST(request: Request) {
  const guard = await requireApiUser();
  if (guard instanceof NextResponse) return guard;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  await setReelSaved(guard.user.uid, parsed.data.reelId, parsed.data.save);
  return NextResponse.json({ ok: true, reelIds: await getSavedReels(guard.user.uid) });
}
