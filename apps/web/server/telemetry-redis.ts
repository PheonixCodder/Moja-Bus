import Redis from "ioredis";

/**
 * Phase 28 (F-TM-08/F-TM-09) — deployment posture, made HONEST:
 *
 * 1. The write-only `driver:{id}:live` hash and the never-called GEOADD
 *    index are DELETED (delete-arm of F-TM-08). The jump gate reads the
 *    DriverProfile.last* columns instead (see telemetry-prev-point.ts), and
 *    proximity search stays roadmap — it should build its own geo index when
 *    a consumer exists.
 * 2. What remains is pub/sub ONLY, feeding the dormant WS gateway channels
 *    (`trip:*:telemetry`, `operator:*:fleet`). No process subscribes yet;
 *    the subscriber relay belongs to the "WS hosting scale-out" roadmap item.
 * 3. Backend selection is LOUD: in-memory IS the official v1 posture for the
 *    single-instance deployment (Phase 09 Option B / F-IN-15). Setting
 *    REDIS_URL/KV_URL switches to real Redis; a failed connect retries with
 *    backoff at boot and then downgrades PERMANENTLY FOR THE PROCESS with an
 *    explicit log — never a silent warn, never a crash loop. The active
 *    backend surfaces in /api/health?full=1 via getTelemetryBackend().
 */

const REDIS_URL = process.env["REDIS_URL"] || process.env["KV_URL"];

class MockPubSubStore {
  private subscribers: Map<string, Set<(message: string) => void>> = new Map();
  private patternSubscribers: Map<
    string,
    Set<(pattern: string, channel: string, message: string) => void>
  > = new Map();

  async publish(channel: string, message: string): Promise<number> {
    let count = 0;
    const listeners = this.subscribers.get(channel);
    if (listeners) {
      listeners.forEach((cb) => {
        cb(message);
      });
      count += listeners.size;
    }
    this.patternSubscribers.forEach((cbs, pattern) => {
      if (
        pattern === "trip:*:telemetry" &&
        channel.startsWith("trip:") &&
        channel.endsWith(":telemetry")
      ) {
        cbs.forEach((cb) => cb(pattern, channel, message));
        count += cbs.size;
      }
    });
    return count;
  }

  subscribe(channel: string, cb: (message: string) => void) {
    let set = this.subscribers.get(channel);
    if (!set) {
      set = new Set();
      this.subscribers.set(channel, set);
    }
    set.add(cb);
  }

  psubscribe(
    pattern: string,
    cb: (pattern: string, channel: string, message: string) => void,
  ) {
    let set = this.patternSubscribers.get(pattern);
    if (!set) {
      set = new Set();
      this.patternSubscribers.set(pattern, set);
    }
    set.add(cb);
  }

  unsubscribe(channel: string, cb: (message: string) => void) {
    this.subscribers.get(channel)?.delete(cb);
  }
}

export type TelemetryBackend = "redis" | "memory";

let redisPub: Redis | MockPubSubStore;
let redisSub: Redis | MockPubSubStore;
let activeBackend: TelemetryBackend = "memory";

function logBackend(level: "info" | "warn" | "error", msg: string) {
  const line = `[Telemetry] ${msg}`;
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

function downgradeToMemoryPermanently(reason: string) {
  // Phase 28 (F-TM-09) — the downgrade is a logged DECISION, not a silent
  // swap. Pub/sub has zero consumers today, so ingest continues unaffected.
  redisPub = new MockPubSubStore() as unknown as Redis;
  redisSub = new MockPubSubStore() as unknown as Redis;
  activeBackend = "memory";
  logBackend(
    "error",
    `backend=memory (DOWNGRADED from redis: ${reason}) — pub/sub unavailable until process restart. Ingest unaffected.`,
  );
}

if (REDIS_URL) {
  const pub = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });
  const sub = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });
  let degraded = false;
  pub.on("error", (err) => {
    if (!degraded)
      logBackend(
        "warn",
        `redis runtime error (continuing on redis): ${err.message}`,
      );
  });

  (async () => {
    // Boot-only bounded retries: 250ms → 500ms → 1s. Recovery after a
    // permanent downgrade = container restart (deliberate; no re-probe
    // machinery for channels nobody subscribes to yet).
    const delaysMs = [250, 500, 1000];
    for (let attempt = 1; attempt <= delaysMs.length; attempt++) {
      try {
        await pub.connect();
        await sub.connect();
        redisPub = pub;
        redisSub = sub;
        activeBackend = "redis";
        logBackend("info", "backend=redis (pub/sub ready)");
        return;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logBackend(
          "warn",
          `redis connect attempt ${attempt}/${delaysMs.length} failed: ${message}`,
        );
        if (attempt < delaysMs.length) {
          await new Promise((r) => setTimeout(r, delaysMs[attempt - 1]));
        }
      }
    }
    degraded = true;
    downgradeToMemoryPermanently(
      `connect failed after ${delaysMs.length} attempts`,
    );
  })();
} else {
  redisPub = new MockPubSubStore() as unknown as Redis;
  redisSub = new MockPubSubStore() as unknown as Redis;
  activeBackend = "memory";
  logBackend(
    "info",
    "backend=memory (REDIS_URL not set — official single-instance v1 posture, see server/telemetry-redis.ts)",
  );
}

export function getTelemetryBackend(): TelemetryBackend {
  return activeBackend;
}

export function setupTripTelemetryRelay(
  onTripMessage: (tripId: string, payload: string) => void,
) {
  if (redisSub instanceof Redis) {
    redisSub.psubscribe("trip:*:telemetry").catch((err) => {
      logBackend(
        "warn",
        `failed to psubscribe to trip telemetry: ${err.message}`,
      );
    });
    redisSub.on("pmessage", (_pattern, channel, message) => {
      const match = channel.match(/^trip:(.+):telemetry$/);
      if (match && match[1]) {
        onTripMessage(match[1], message);
      }
    });
  } else if (redisSub && typeof (redisSub as any).psubscribe === "function") {
    (redisSub as MockPubSubStore).psubscribe(
      "trip:*:telemetry",
      (_pattern, channel, message) => {
        const match = channel.match(/^trip:(.+):telemetry$/);
        if (match && match[1]) {
          onTripMessage(match[1], message);
        }
      },
    );
  }
}

export { redisPub, redisSub };
