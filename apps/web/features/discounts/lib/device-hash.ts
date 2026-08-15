const STORAGE_KEY = "moja:device-id:v1";

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Stable anonymized device fingerprint for referral abuse checks.
 * Stores a random UUID locally and returns a SHA-256 hex prefix (64 chars max).
 */
export async function getDeviceHash(): Promise<string | undefined> {
  if (typeof window === "undefined") return undefined;
  try {
    let id = window.localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(STORAGE_KEY, id);
    }
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(`moja-ride:${id}`),
    );
    return bytesToHex(digest).slice(0, 64);
  } catch {
    return undefined;
  }
}
