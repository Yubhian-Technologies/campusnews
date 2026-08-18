/**
 * /api/me/likes
 *   GET  — the current user's account-persisted likes (article slugs + reel ids).
 *   POST — { type, id, like } toggle one, OR { merge: { articles, reels } } to
 *          fold device-local likes into the account on login.
 * Requires an authenticated, ACTIVE user. (Guests like via localStorage only.)
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth/api-guard";
import { getLikes, mergeLikes, setLike } from "@/lib/firebase/users";

export async function GET() {
  const guard = await requireApiUser();
  if (guard instanceof NextResponse) return guard;
  return NextResponse.json(await getLikes(guard.user.uid));
}

const toggleSchema = z.object({
  type: z.enum(["article", "reel"]),
  id: z.string().trim().min(1),
  like: z.boolean(),
});
const mergeSchema = z.object({
  merge: z.object({
    articles: z.array(z.string()).default([]),
    reels: z.array(z.string()).default([]),
  }),
});

export async function POST(request: Request) {
  const guard = await requireApiUser();
  if (guard instanceof NextResponse) return guard;
  const uid = guard.user.uid;
  const body = await request.json().catch(() => null);

  const merge = mergeSchema.safeParse(body);
  if (merge.success) {
    await mergeLikes(uid, merge.data.merge.articles, merge.data.merge.reels);
    return NextResponse.json(await getLikes(uid));
  }

  const toggle = toggleSchema.safeParse(body);
  if (toggle.success) {
    await setLike(uid, toggle.data.type, toggle.data.id, toggle.data.like);
    return NextResponse.json(await getLikes(uid));
  }

  return NextResponse.json({ error: "Invalid request." }, { status: 400 });
}
