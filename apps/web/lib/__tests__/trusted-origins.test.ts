import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  APP_SCHEMES,
  buildTrustedOrigins,
  DEV_FALLBACK_ORIGINS,
} from "../trusted-origins";

/**
 * Phase 35 (F-IN-16, D35-5) — the two environment shapes. The audit defect
 * encoded: six localhost defaults + exp:// were trusted unconditionally,
 * including production.
 */
describe("buildTrustedOrigins", () => {
  const base = { baseUrl: "https://api.mojaride.net", expoDevOrigin: null };

  it("production: own origin + explicit ALLOWED_ORIGINS + app schemes only", () => {
    const origins = buildTrustedOrigins({
      ...base,
      explicitAllowedOrigins: ["https://mojaride.net"],
      isProd: true,
    });
    assert.deepEqual(origins.sort(), [
      "driver-app://",
      "https://api.mojaride.net",
      "https://mojaride.net",
      "traveler-app://",
    ]);
  });

  it("production with env UNSET contains no localhost and no exp://", () => {
    const origins = buildTrustedOrigins({
      ...base,
      explicitAllowedOrigins: [],
      isProd: true,
    });
    for (const origin of origins) {
      assert.ok(!origin.includes("localhost"), origin);
      assert.ok(!origin.includes("127.0.0.1"), origin);
      assert.notEqual(origin, "exp://");
    }
  });

  it("development: localhost fallbacks + Expo Go origins are present", () => {
    const origins = buildTrustedOrigins({
      ...base,
      explicitAllowedOrigins: [...DEV_FALLBACK_ORIGINS],
      isProd: false,
    });
    for (const dev of DEV_FALLBACK_ORIGINS) assert.ok(origins.includes(dev));
    assert.ok(origins.includes("exp://"));
    assert.ok(origins.includes("http://localhost:8081"));
  });

  it("app schemes are trusted in every environment", () => {
    for (const isProd of [true, false]) {
      const origins = buildTrustedOrigins({
        ...base,
        explicitAllowedOrigins: [],
        isProd,
      });
      for (const scheme of APP_SCHEMES) assert.ok(origins.includes(scheme));
    }
  });

  it("EXPO_DEV_ORIGIN is honored as an explicit opt-in (recovery path)", () => {
    const origins = buildTrustedOrigins({
      ...base,
      explicitAllowedOrigins: [],
      isProd: true,
      expoDevOrigin: "exp://192.168.1.5:8081",
    });
    assert.ok(origins.includes("exp://192.168.1.5:8081"));
  });
});
