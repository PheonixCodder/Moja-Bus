import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@moja/ui"],
  serverExternalPackages: ["better-auth"],
};

export default nextConfig;
