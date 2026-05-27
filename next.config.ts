import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for GitHub Pages hosting
  output: "export",

  // GitHub Pages serves this repo at /alphaos
  basePath: "/alphaos",

  // Trailing slash so GitHub Pages finds index.html correctly
  trailingSlash: true,

  // next/image requires a custom loader in static export mode
  images: { unoptimized: true },
};

export default nextConfig;
