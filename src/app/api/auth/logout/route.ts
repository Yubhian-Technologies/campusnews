/**
 * POST /api/auth/logout
 * Clear the session cookie and revoke the user's refresh tokens so the session
 * cannot be reused.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/config";
import { adminAuth } from "@/lib/firebase/admin";

export async function POST() {
  const store = await cookies();
  const cookie = store.get(SESSION_COOKIE_NAME)?.value;

  if (cookie) {
    try {
      const decoded = await adminAuth().verifySessionCookie(cookie);
      await adminAuth().revokeRefreshTokens(decoded.sub);
    } catch {
      /* already invalid — nothing to revoke */
    }
  }

  store.delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
