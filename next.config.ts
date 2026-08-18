import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Cover images are author-supplied URLs, so allow any HTTPS host.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  // firebase-admin/auth pulls in jwks-rsa -> jose, and jose ships ESM-only.
  // Bundling it (Turbopack's default) tries to require() that ESM build and
  // fails with ERR_REQUIRE_ESM at runtime — every route touching adminAuth()
  // 500s. Marking these external makes Next.js load them via Node's own
  // require/import resolution at runtime instead of bundling them, which
  // handles the ESM/CJS interop correctly.
  serverExternalPackages: ["firebase-admin", "jwks-rsa", "jose"],
};

export default nextConfig;
