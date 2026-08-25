import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isMutationOriginAllowed } from "../mutation-origin";

/**
 * Phase 35 (F-IN-08) — the full origin matrix for tRPC mutations.
 * The audit defect encoded: malformed Origin used to throw (INTERNAL 500)
 * instead of FORBIDDEN.
 */
describe("isMutationOriginAllowed", () => {
  const prod = { NODE_ENV: "production" } as NodeJS.ProcessEnv;
  const dev = { NODE_ENV: "development" } as NodeJS.ProcessEnv;

  it("no Origin header passes (native apps send none by design)", () => {
    assert.equal(
      isMutationOriginAllowed({ origin: null, host: "mojaride.net" }),
      true,
    );
  });

  it("malformed Origin is rejected, not a 500", () => {
    assert.equal(
      isMutationOriginAllowed({
        origin: "not-a-url",
        host: "mojaride.net",
        env: prod,
      }),
      false,
    );
    assert.equal(
      isMutationOriginAllowed({
        origin: "http://",
        host: "mojaride.net",
        env: prod,
      }),
      false,
    );
  });

  it("same-host https origin passes in production", () => {
    assert.equal(
      isMutationOriginAllowed({
        origin: "https://mojaride.net",
        host: "mojaride.net",
        env: prod,
      }),
      true,
    );
  });

  it("production pins the scheme: same host over http is FORBIDDEN", () => {
    assert.equal(
      isMutationOriginAllowed({
        origin: "http://mojaride.net",
        host: "mojaride.net",
        env: prod,
      }),
      false,
    );
  });

  it("cross-origin is FORBIDDEN unless explicitly allow-listed", () => {
    const env = {
      NODE_ENV: "production",
      ALLOWED_ORIGINS: "https://blog.mojaride.net, https://partner.example.com",
    } as NodeJS.ProcessEnv;
    assert.equal(
      isMutationOriginAllowed({
        origin: "https://evil.example.com",
        host: "mojaride.net",
        env,
      }),
      false,
    );
    assert.equal(
      isMutationOriginAllowed({
        origin: "https://partner.example.com",
        host: "mojaride.net",
        env,
      }),
      true,
    );
  });

  it("dev allows any scheme of the same host (localhost friction-free)", () => {
    assert.equal(
      isMutationOriginAllowed({
        origin: "http://localhost:3000",
        host: "localhost:3000",
        env: dev,
      }),
      true,
    );
  });

  it("dev still rejects cross-origin", () => {
    assert.equal(
      isMutationOriginAllowed({
        origin: "http://evil.example.com",
        host: "localhost:3000",
        env: dev,
      }),
      false,
    );
  });
});
