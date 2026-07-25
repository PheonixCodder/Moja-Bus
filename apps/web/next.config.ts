import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin(
  // Points to the request config — must be this exact path
  "./i18n/request.ts"
);

const nextConfig: NextConfig = {
  transpilePackages: ["@moja/ui", "@moja/schemas", "@moja/db"],
  serverExternalPackages: ["better-auth"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.mojaride.com" },
    ],
  },
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

export default withNextIntl(nextConfig);
