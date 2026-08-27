import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { describe, it } from "node:test";

/**
 * Phase 22 (F-NF-10) — outbox durability guard.
 *
 * Production drains the outbox via deploy/cron/crontab.template running
 * process-outbox EVERY MINUTE (worst-case delivery latency ≈1 min). This test
 * converts that guarantee into a CI invariant: if the line is removed,
 * renamed, or downgraded to hourly/daily, the suite fails before any deploy
 * can silently stretch notification latency.
 *
 * vercel.json is additionally asserted (Phase 36) to be a route-subset of the
 * authoritative crontab — its CADENCES legitimately diverge (non-prod
 * reference, Vercel free-tier limits); route identity may not.
 */
const crontab = readFileSync(
  new URL("../../../../deploy/cron/crontab.template", import.meta.url),
  "utf8",
);

describe("outbox cadence guard (F-NF-10)", () => {
  it("runs process-outbox every minute in production", () => {
    assert.match(
      crontab,
      /^\* \* \* \* \* .*\/api\/cron\/process-outbox$/m,
      "process-outbox must stay on the every-minute schedule",
    );
  });

  it("authenticates the cron call with the injected secret", () => {
    const line = crontab
      .split("\n")
      .find((l) => l.includes("/api/cron/process-outbox"));
    assert.ok(line?.includes("__CRON_SECRET__"), "cron secret missing");
  });
});

// ============================================================================
// Phase 36 (F-IN-07) — full route↔schedule parity. The single-line guard
// above only pinned process-outbox; these invariants make the AUTHORITATIVE
// source mechanical:
//   • every /api/cron/* route directory MUST have a crontab line (a new cron
//     that forgets its schedule is dead code in prod), and
//   • every crontab line MUST point at an existing route directory (renames
//     leave stale lines that 404 forever, silently unscheduling a job).
// vercel.json is additionally asserted to be a SUBSET of the authoritative
// routes: it is the non-prod Vercel-testing reference where free-tier limits
// force reduced frequency — divergence in CADENCE is expected and fine;
// divergence in ROUTE IDENTITY means someone renamed a cron without
// updating one of the two files.
// ============================================================================

const cronRoutesDir = new URL("../../app/api/cron", import.meta.url);
const routeDirs = readdirSync(cronRoutesDir).filter(
  (name) => !name.startsWith("."),
);

describe("cron route↔schedule parity (F-IN-07)", () => {
  it("schedules EVERY /api/cron/* route in the authoritative crontab", () => {
    assert.ok(routeDirs.length > 0, "no cron routes found — path drift");
    for (const route of routeDirs) {
      assert.match(
        crontab,
        new RegExp(`/api/cron/${route}\\b`),
        `route "${route}" has no schedule in deploy/cron/crontab.template — it will NEVER run in production`,
      );
    }
  });

  it("has no stale crontab lines pointing at deleted routes", () => {
    const scheduled = [...crontab.matchAll(/\/api\/cron\/([a-z0-9-]+)/g)].map(
      (m) => m[1] ?? "",
    );
    for (const name of scheduled) {
      assert.ok(
        routeDirs.includes(name),
        `crontab schedules "/api/cron/${name}" but no such route directory exists — stale line`,
      );
    }
  });

  it("keeps vercel.json paths a subset of the authoritative routes", () => {
    const vercel = JSON.parse(
      readFileSync(new URL("../../vercel.json", import.meta.url), "utf8"),
    ) as { crons?: Array<{ path: string }> };
    for (const entry of vercel.crons ?? []) {
      const name = entry.path.split("/").pop();
      assert.ok(name, `vercel.json entry without a path: ${entry.path}`);
      assert.ok(
        routeDirs.includes(name),
        `vercel.json schedules unknown route "${name}"`,
      );
      assert.match(
        crontab,
        new RegExp(`/api/cron/${name}\\b`),
        `vercel.json route "${name}" is missing from the authoritative crontab`,
      );
    }
  });
});
