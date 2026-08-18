import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Cover images are author-supplied URLs, so allow any HTTPS host.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
