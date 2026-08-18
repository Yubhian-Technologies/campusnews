/**
 * Edge middleware: first-line route protection.
 *
 * The Admin SDK cannot run on the Edge runtime, so middleware only checks for
 * the presence of the session cookie and redirects unauthenticated requests to
 * /login. The AUTHORITATIVE verification (cookie signature, revocation, status,
 * role, scope) happens in the Node-runtime protected layouts via requireRole()
 * / requireUser(). Never rely on this check alone (spec §22).
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/config";

const PROTECTED_PREFIXES = [
  "/admin",
  "/news-head",
  "/college-head",
  "/reporter",
  "/student",
  "/newsroom",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!isProtected) return NextResponse.next();

  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (hasSession) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/news-head/:path*",
    "/college-head/:path*",
    "/reporter/:path*",
    "/student/:path*",
    "/newsroom/:path*",
  ],
};
