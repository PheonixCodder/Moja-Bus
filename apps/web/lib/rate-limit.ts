/**
 * Lightweight in-memory fixed-window rate limiter.
 *
 * Kept dependency-free and injectable so it can be unit-tested (and swapped for
 * a Redis/DB backend later without changing call sites). Fixed-window is fine
 * for our abuse-guard needs on public capture endpoints (submit by token + IP).
 */

export interface RateLimitBucket {
  count: number;
  windowStart: number;
}

export interface RateLimitStore {
  get(key: string): RateLimitBucket | undefined;
  set(key: string, bucket: RateLimitBucket): void;
}

export interface RateLimiterOptions {
  windowMs: number;
  max: number;
  now?: () => number;
  store?: RateLimitStore;
}

export interface RateLimitResult {
  ok: boolean;
  retryAfterMs: number;
}

/** Map-backed store. Not cleared between serverless invocations by design —
 *  each instance carries its own window, which is acceptable for this gate. */
export function createInMemoryRateLimitStore(): RateLimitStore {
  const buckets = new Map<string, RateLimitBucket>();
  return {
    get: (key) => buckets.get(key),
    set: (key, bucket) => {
      buckets.set(key, bucket);
    },
  };
}

export function createRateLimiter(
  options: RateLimiterOptions,
): (key: string) => RateLimitResult {
  const now = options.now ?? Date.now;
  const store = options.store ?? createInMemoryRateLimitStore();

  return (key) => {
    const time = now();
    const bucket = store.get(key);

    // Window expired → start a fresh window.
    if (!bucket || time - bucket.windowStart >= options.windowMs) {
      store.set(key, { count: 1, windowStart: time });
      return { ok: true, retryAfterMs: 0 };
    }

    if (bucket.count >= options.max) {
      return {
        ok: false,
        retryAfterMs: options.windowMs - (time - bucket.windowStart),
      };
    }

    store.set(key, {
      count: bucket.count + 1,
      windowStart: bucket.windowStart,
    });
    return { ok: true, retryAfterMs: 0 };
  };
}
