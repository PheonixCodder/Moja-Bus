import type { NextConfig } from "next";
import path from "node:path";
import createNextIntlPlugin from "next-intl/plugin";

// Phase 35 (F-IN-09) — first-party object-storage host, parsed at config time
// so each environment's bucket front is honored without hardcoding it here.
function resolveS3PublicHost(): string | null {
  const base = process.env["S3_PUBLIC_URL_BASE"];
  if (!base) return null;
  try {
    return new URL(base).hostname;
  } catch {
    return null;
  }
}

const s3PublicHost = resolveS3PublicHost();

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
    // Phase 35 (F-IN-09) — first-party hosts ONLY. The previous `hostname:"**"`
    // let anyone bounce requests through our image optimizer (SSRF surface +
    // free image proxying). Editor-supplied arbitrary URLs (blog MDX,
    // admin banners, author avatars) bypass the optimizer with the
    // `unoptimized` prop instead of widening this list.
    remotePatterns: [
      { protocol: "https", hostname: "cdn.mojaride.com" },
      ...(s3PublicHost
        ? [{ protocol: "https" as const, hostname: s3PublicHost }]
        : []),
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
