import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  ...(process.env.GITHUB_PAGES === "true" ? {
    output: "export" as const,
    basePath: "/portfolio",
    trailingSlash: true,
    images: { unoptimized: true },
    distDir: ".next-pages",
  } : {}),
};

export default nextConfig;
