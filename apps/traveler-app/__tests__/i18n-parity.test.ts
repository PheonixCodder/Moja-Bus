import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

/**
 * Phase 38 (F-PS-12) — en↔fr key-structure parity for EVERY locale file.
 * A missing key in one language renders a raw key (or empty) for that user;
 * this makes that impossible to merge unnoticed.
 */
const localesDir = fileURLToPath(new URL("../locales", import.meta.url));

function listNamespaces(langDir: string): string[] {
	return readdirSync(langDir)
		.filter((f) => f.endsWith(".json"))
		.map((f) => f.replace(/\.json$/, ""));
}

function keyPaths(value: unknown, prefix = ""): string[] {
	if (value === null || typeof value !== "object") return [prefix];
	return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
		keyPaths(v, prefix ? `${prefix}.${k}` : k),
	);
}

function readKeys(lang: string, ns: string): string[] {
	return keyPaths(
		JSON.parse(readFileSync(join(localesDir, lang, `${ns}.json`), "utf8")),
	).sort();
}

describe("i18n en↔fr key parity (Phase 38)", () => {
	const namespaces = [
		...new Set([
			...listNamespaces(join(localesDir, "en")),
			...listNamespaces(join(localesDir, "fr")),
		]),
	].sort();

	it("found locale namespaces to compare", () => {
		assert.ok(namespaces.length > 0, "no namespaces discovered");
	});

	for (const ns of namespaces) {
		it(`namespace "${ns}": en and fr share identical key sets`, () => {
			const en = readKeys("en", ns);
			const fr = readKeys("fr", ns);
			assert.deepEqual(fr, en);
		});
	}
});
