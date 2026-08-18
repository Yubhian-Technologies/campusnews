/**
 * POST /api/auth/register
 *
 * Self-service sign-up. The client already created the Firebase Auth account
 * (createUserWithEmailAndPassword) and sent itself a verification email; this
 * creates the matching /users/{uid} profile — password never touches our
 * server, only the idToken proving the client-created account.
 *
 * A college-domain email (matching some college's configured `domain`)
 * becomes a Student Contributor, gated PENDING_EMAIL_VERIFICATION until they
 * click the link (enforced at /api/auth/session). Any other email becomes an
 * unaffiliated reader — ACTIVE immediately, no roles, no verification gate:
 * they can sign in and like/save, but have no posting rights.
 */
import { NextResponse } from "next/server";
import { DEFAULT_SOCIETY_ID } from "@/lib/config";
import { adminAuth } from "@/lib/firebase/admin";
import { createUserProfile, getUserProfile } from "@/lib/firebase/users";
import { getCollegeByDomain } from "@/lib/firebase/org";

export async function POST(request: Request) {
  const { idToken, displayName } = (await request.json().catch(() => ({}))) as {
    idToken?: string;
    displayName?: string;
  };

  if (!idToken || !displayName?.trim()) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }

  let decoded;
  try {
    decoded = await adminAuth().verifyIdToken(idToken, true);
  } catch {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  if (await getUserProfile(decoded.uid)) {
    return NextResponse.json(
      { error: "This account is already registered." },
      { status: 409 },
    );
  }

  const email = (decoded.email ?? "").toLowerCase();
  const domain = email.split("@")[1] ?? "";
  const college = domain ? await getCollegeByDomain(domain) : null;

  try {
    await createUserProfile({
      uid: decoded.uid,
      email,
      displayName: displayName.trim(),
      status: college ? "PENDING_EMAIL_VERIFICATION" : "ACTIVE",
      societyId: DEFAULT_SOCIETY_ID,
      locationId: college?.locationId ?? null,
      collegeId: college?.id ?? null,
      roleIds: college ? ["student"] : [],
    });
  } catch (error) {
    // Roll back the orphaned auth user so registration stays all-or-nothing.
    await adminAuth()
      .deleteUser(decoded.uid)
      .catch(() => {});
    throw error;
  }

  return NextResponse.json({ ok: true, isStudent: !!college }, { status: 201 });
}
