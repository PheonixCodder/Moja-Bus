/**
 * Allow only same-app relative paths for post-login redirects.
 * Blocks protocol-relative URLs, absolute URLs, and non-path values.
 */
export function getSafeCallbackUrl(
  raw: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!raw) return fallback;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return fallback;
  }
  const trimmed = decoded.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }
  if (trimmed.includes("://")) {
    return fallback;
  }
  return trimmed;
}

export function buildLoginUrl(callbackUrl: string): string {
  const safe = getSafeCallbackUrl(callbackUrl, "/search");
  return `/login?callbackUrl=${encodeURIComponent(safe)}`;
}
