import assert from "node:assert/strict";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

/**
 * Phase 38 (F-PS-12) — en↔fr key-structure parity for EVERY web message
 * pair under each feature's messages directory. next-intl throws on
 * missing keys at runtime; this catches drift at CI time instead.
 */
const featuresDir = fileURLToPath(new URL("../../features", import.meta.url));

function keyPaths(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object") return [prefix];
  return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
    keyPaths(v, prefix ? `${prefix}.${k}` : k),
  );
}

describe("web message en↔fr parity (Phase 38)", () => {
  const messageDirs = readdirSync(featuresDir)
    .map((name) => join(featuresDir, name, "messages"))
    .filter((dir) => existsSync(dir));

  it("found feature message directories to compare", () => {
    assert.ok(messageDirs.length > 0, "no */messages directories found");
  });

  for (const dir of messageDirs) {
    const feature = dir.split(/[/\\]features[/\\]/)[1]?.split(/[/\\]/)[0];
    const hasPair =
      existsSync(join(dir, "en.json")) && existsSync(join(dir, "fr.json"));
    it(`feature "${feature}": en and fr share identical key sets`, () => {
      assert.ok(hasPair, `${dir} must contain both en.json and fr.json`);
      const en = keyPaths(
        JSON.parse(readFileSync(join(dir, "en.json"), "utf8")),
      ).sort();
      const fr = keyPaths(
        JSON.parse(readFileSync(join(dir, "fr.json"), "utf8")),
      ).sort();
      assert.deepEqual(fr, en);
    });
  }
});
