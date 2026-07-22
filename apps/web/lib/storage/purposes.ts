/**
 * StoragePurpose registry — the single source of truth that differentiates every
 * object-storage asset class in the app (compliance docs, logos, avatars, blog
 * covers, …). Each purpose declares its visibility, IAM scope, key strategy,
 * size/type limits, optional client-side image optimization, and cache policy.
 *
 * This module is isomorphically safe (no Node-only imports) so it can be imported
 * by both the server signing code and the client upload code (to read image hints).
 */

export type StorageVisibility = "public" | "private";
export type StorageIam = "passenger" | "operator" | "admin";

export interface StorageKeyContext {
  companyId?: string | undefined;
  userId?: string | undefined;
  staffId?: string | undefined;
  slug?: string | undefined;
  fileName?: string | undefined;
}

export type StoragePurposeId =
  | "operator-document"
  | "operator-logo"
  | "operator-profile-photo"
  | "passenger-avatar"
  | "blog-cover";

export interface StoragePurposeConfig {
  id: StoragePurposeId;
  /** public = served via CDN/public URL; private = only via presigned GET. */
  visibility: StorageVisibility;
  /** Who is allowed to write/read this asset. Enforced in the storage router. */
  iam: StorageIam;
  limits: { maxBytes: number; allowedMime: RegExp[] };
  /** When set, the client resizes + (optionally) re-encodes to WebP before upload. */
  image?: { maxDim: number; quality: number; toWebp: boolean };
  /** Cache-Control header applied on PUT (public assets only). */
  cacheControl: string;
  /** Docs keep every version (audit trail); singletons overwrite their key. */
  keepVersions: boolean;
  /** Builds the S3 object key. Called server-side only. */
  key: (ctx: StorageKeyContext) => string;
}

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
}

const MB = 1024 * 1024;

export const STORAGE_PURPOSES: Record<StoragePurposeId, StoragePurposeConfig> = {
  "operator-document": {
    id: "operator-document",
    visibility: "private",
    iam: "operator",
    limits: { maxBytes: 10 * MB, allowedMime: [/^application\/pdf$/, /^image\//] },
    cacheControl: "",
    keepVersions: true,
    key: (ctx) =>
      `documents/${ctx.companyId}/${crypto.randomUUID()}-${safeName(ctx.fileName ?? "doc")}`,
  },
  "operator-logo": {
    id: "operator-logo",
    visibility: "public",
    iam: "operator",
    limits: { maxBytes: 2 * MB, allowedMime: [/^image\//] },
    image: { maxDim: 512, quality: 0.9, toWebp: true },
    cacheControl: "max-age=31536000, immutable",
    keepVersions: false,
    key: (ctx) => `assets/${ctx.companyId}/logo.webp`,
  },
  "operator-profile-photo": {
    id: "operator-profile-photo",
    visibility: "public",
    iam: "operator",
    limits: { maxBytes: 2 * MB, allowedMime: [/^image\//] },
    image: { maxDim: 256, quality: 0.9, toWebp: true },
    cacheControl: "max-age=31536000, immutable",
    keepVersions: false,
    key: (ctx) => `assets/${ctx.companyId}/staff/${ctx.staffId}.webp`,
  },
  "passenger-avatar": {
    id: "passenger-avatar",
    visibility: "public",
    iam: "passenger",
    limits: { maxBytes: 2 * MB, allowedMime: [/^image\//] },
    image: { maxDim: 256, quality: 0.9, toWebp: true },
    cacheControl: "max-age=31536000, immutable",
    keepVersions: false,
    key: (ctx) => `assets/users/${ctx.userId}/avatar`,
  },
  "blog-cover": {
    id: "blog-cover",
    visibility: "public",
    iam: "admin",
    limits: { maxBytes: 5 * MB, allowedMime: [/^image\//] },
    image: { maxDim: 1200, quality: 0.85, toWebp: true },
    cacheControl: "max-age=31536000, immutable",
    keepVersions: false,
    key: (ctx) => `assets/blog/${ctx.slug}`,
  },
};

export function getStoragePurpose(id: string): StoragePurposeConfig {
  const purpose = STORAGE_PURPOSES[id as StoragePurposeId];
  if (!purpose) {
    throw new Error(`Unknown storage purpose: ${id}`);
  }
  return purpose;
}
