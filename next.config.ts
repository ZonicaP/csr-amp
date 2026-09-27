import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@vercel/functions", "ws"],
  experimental: {
    optimizePackageImports: ["@mui/material"],
  },
};

export default nextConfig;
