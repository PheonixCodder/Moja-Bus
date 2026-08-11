import type { NextConfig } from "next";
import path from "node:path";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin(
  // Points to the request config — must be this exact path
  "./i18n/request.ts"
);

const nextConfig: NextConfig = {
  // Self-hosted production build: emit a minimal standalone runtime so the
  // Docker image doesn't ship the full node_modules tree.
  output: "standalone",
  // Monorepo tracing root — required so output-file-tracing picks up workspace
  // packages and shared deps that live outside apps/web.
  outputFileTracingRoot: path.join(__dirname, "../.."),
  transpilePackages: ["@moja/ui", "@moja/schemas", "@moja/db"],
  // Kept external (not bundled). better-auth is required dynamically by the
  // app; the Prisma driver adapter + pg are loaded via createRequire in
  // @moja/db, so they must stay as real node_modules at runtime.
  serverExternalPackages: [
    "better-auth",
    "@prisma/adapter-pg",
    "pg",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.mojaride.com" },
      // Allow any HTTPS hostname — covers S3, external CDNs, and user-provided
      // image URLs embedded in blog post MDX content.
      { protocol: "https", hostname: "**" },
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
