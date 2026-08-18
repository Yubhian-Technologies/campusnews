/**
 * POST /api/auth/session
 * Exchange a freshly minted Firebase ID token for an httpOnly session cookie.
 *
 * The client signs in with the Firebase client SDK, then posts its ID token
 * here. We verify it, enforce the status gate server-side (a SUSPENDED/INACTIVE
 * user is rejected even though Firebase authenticated them, spec §3), mint a
 * session cookie via the Admin SDK, and set it httpOnly/Secure/SameSite.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE_MAX_AGE_MS,
  SESSION_COOKIE_NAME,
} from "@/lib/config";
import { adminAuth } from "@/lib/firebase/admin";
import {
  getUserProfile,
  touchLastLogin,
  updateUserProfile,
} from "@/lib/firebase/users";
import { APP_AUTH_ERRORS } from "@/lib/firebase/errors";

export async function POST(request: Request) {
  const { idToken } = (await request.json().catch(() => ({}))) as {
    idToken?: string;
  };

  if (!idToken) {
    return NextResponse.json({ error: "Missing idToken." }, { status: 400 });
  }

  let decoded;
  try {
    decoded = await adminAuth().verifyIdToken(idToken, true);
  } catch {
    return NextResponse.json(
      { error: "Invalid credentials." },
      { status: 401 },
    );
  }

  // Status gate: the profile is the source of truth for whether an
  // authenticated user may actually use the application.
  const profile = await getUserProfile(decoded.uid);
  if (!profile) {
    return NextResponse.json(
      { code: APP_AUTH_ERRORS.NO_PROFILE },
      { status: 403 },
    );
  }
  if (profile.status === "SUSPENDED") {
    return NextResponse.json(
      { code: APP_AUTH_ERRORS.ACCOUNT_SUSPENDED },
      { status: 403 },
    );
  }
  if (profile.status === "PENDING_EMAIL_VERIFICATION") {
    if (!decoded.email_verified) {
      return NextResponse.json(
        { code: APP_AUTH_ERRORS.EMAIL_NOT_VERIFIED },
        { status: 403 },
      );
    }
    // They've clicked the verification link since the account was created —
    // promote to ACTIVE now, on this first successful sign-in attempt.
    await updateUserProfile(decoded.uid, { status: "ACTIVE" });
    profile.status = "ACTIVE";
  }
  if (profile.status !== "ACTIVE") {
    return NextResponse.json(
      { code: APP_AUTH_ERRORS.ACCOUNT_INACTIVE },
      { status: 403 },
    );
  }

  const sessionCookie = await adminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_COOKIE_MAX_AGE_MS,
  });

  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE_MS / 1000,
  });

  await touchLastLogin(decoded.uid).catch(() => {
    /* non-fatal: last-login is best-effort */
  });

  return NextResponse.json({
    ok: true,
    home: profile.roleIds,
  });
}
