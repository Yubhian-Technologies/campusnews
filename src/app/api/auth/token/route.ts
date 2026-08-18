/**
 * POST /api/auth/token
 *
 * Bridges an existing httpOnly session cookie back into a client-side Firebase
 * Auth session. The client SDK's own sign-in is scoped to sessionStorage (spec
 * §14 — no durable tokens in browser storage), so it's per-tab: a new tab, a
 * bookmarked link, or a reload that lost sessionStorage all leave the cookie
 * valid (pages render, /api/me works) while `getClientAuth().currentUser` is
 * null. Direct-to-Storage uploads need a real client Auth session (Storage
 * rules read `request.auth`, which the cookie is invisible to), so
 * AuthProvider calls this once it has a cookie-backed profile but no
 * `currentUser`, then exchanges the short-lived custom token via
 * `signInWithCustomToken`.
 */
import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-guard";
import { adminAuth } from "@/lib/firebase/admin";

export async function POST() {
  const guard = await requireApiUser();
  if (guard instanceof NextResponse) return guard;

  const customToken = await adminAuth().createCustomToken(guard.user.uid);
  return NextResponse.json({ customToken });
}
