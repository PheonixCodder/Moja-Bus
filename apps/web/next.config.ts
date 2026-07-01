import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@moja/ui", "@moja/schemas"],
  serverExternalPackages: ["better-auth"],
  turbopack: {
    resolveExtensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".json"],
  },
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
    };
    return config;
  },
};

export default nextConfig;
