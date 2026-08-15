const STORAGE_KEY = "moja.pendingReferralCode";

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

export function storePendingReferralCode(code: string): void {
  if (typeof window === "undefined") return;
  const normalized = normalizeCode(code);
  if (normalized.length < 3) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, normalized);
  } catch {
    // ignore quota / private mode
  }
}

export function peekPendingReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const normalized = normalizeCode(raw);
    return normalized.length >= 3 ? normalized : null;
  } catch {
    return null;
  }
}

export function consumePendingReferralCode(): string | null {
  const code = peekPendingReferralCode();
  if (!code) return null;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  return code;
}

export function clearPendingReferralCode(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Canonical passenger invite path (avoid colliding with /invite staff tokens). */
export function referralInvitePath(code: string): string {
  return `/r/${encodeURIComponent(normalizeCode(code))}`;
}
