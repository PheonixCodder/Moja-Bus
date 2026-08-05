import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createRateLimiter } from "../rate-limit";

describe("createRateLimiter", () => {
  it("allows requests up to the max then blocks", () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 3, now: () => 0 });
    assert.equal(limiter("key").ok, true);
    assert.equal(limiter("key").ok, true);
    assert.equal(limiter("key").ok, true);
    const blocked = limiter("key");
    assert.equal(blocked.ok, false);
    assert.equal(blocked.retryAfterMs, 1000);
  });

  it("resets after the window elapses", () => {
    let time = 0;
    const limiter = createRateLimiter({
      windowMs: 1000,
      max: 1,
      now: () => time,
    });
    limiter("key");
    assert.equal(limiter("key").ok, false);
    time = 1001;
    assert.equal(limiter("key").ok, true);
  });

  it("tracks keys independently", () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 1, now: () => 0 });
    assert.equal(limiter("a").ok, true);
    assert.equal(limiter("b").ok, true);
    assert.equal(limiter("a").ok, false);
  });
});
