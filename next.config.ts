import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  // Static export only for GitHub Pages (production build)
  // In dev mode: full Next.js server with API routes enabled
  ...(isProd && { output: "export" }),

  // basePath only needed for GitHub Pages (served at /alphaos)
  // In dev mode: no prefix so fetch('/api/...') works directly
  basePath: isProd ? "/alphaos" : "",

  trailingSlash: isProd,

  images: { unoptimized: true },
};

export default nextConfig;
