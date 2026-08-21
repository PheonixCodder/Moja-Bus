import Redis from "ioredis";

const REDIS_URL = process.env["REDIS_URL"] || process.env["KV_URL"];

class MockRedisStore {
  private geoData: Map<string, Map<string, { lat: number; lng: number }>> = new Map();
  private hashes: Map<string, Map<string, string>> = new Map();
  private subscribers: Map<string, Set<(message: string) => void>> = new Map();

  async geoadd(key: string, lng: number, lat: number, member: string) {
    if (!this.geoData.has(key)) this.geoData.set(key, new Map());
    this.geoData.get(key)!.set(member, { lat, lng });
    return 1;
  }

  async hset(key: string, data: Record<string, any>) {
    if (!this.hashes.has(key)) this.hashes.set(key, new Map());
    const hash = this.hashes.get(key)!;
    for (const [k, v] of Object.entries(data)) {
      hash.set(k, typeof v === "object" ? JSON.stringify(v) : String(v));
    }
    return Object.keys(data).length;
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    const hash = this.hashes.get(key);
    if (!hash) return {};
    const obj: Record<string, string> = {};
    for (const [k, v] of hash.entries()) {
      obj[k] = v;
    }
    return obj;
  }

  async publish(channel: string, message: string): Promise<number> {
    const listeners = this.subscribers.get(channel);
    if (listeners) {
      listeners.forEach((cb) => cb(message));
      return listeners.size;
    }
    return 0;
  }

  subscribe(channel: string, cb: (message: string) => void) {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    this.subscribers.get(channel)!.add(cb);
  }

  unsubscribe(channel: string, cb: (message: string) => void) {
    const listeners = this.subscribers.get(channel);
    if (listeners) {
      listeners.delete(cb);
    }
  }
}

let redisPub: Redis | MockRedisStore;
let redisSub: Redis | MockRedisStore;

if (REDIS_URL) {
  redisPub = new Redis(REDIS_URL, { maxRetriesPerRequest: 3, lazyConnect: true });
  redisSub = new Redis(REDIS_URL, { maxRetriesPerRequest: 3, lazyConnect: true });
  redisPub.connect().catch((err) => {
    console.warn("[Telemetry] Redis connection fallback to in-memory store:", err.message);
    redisPub = new MockRedisStore() as any;
    redisSub = new MockRedisStore() as any;
  });
} else {
  redisPub = new MockRedisStore() as any;
  redisSub = new MockRedisStore() as any;
}

export { redisPub, redisSub };
