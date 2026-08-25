import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

/**
 * Phase 37 (F-IN-12 closure guard) — cron code must never interpolate SQL.
 *
 * The reconcile route's `$queryRawUnsafe` calls (and its dead computed
 * variable) were converted to tagged `$queryRaw` in Phase 29's ride-along.
 * This suite converts that cleanup into a CI invariant: raw-unsafe Prisma
 * entry points are banned outright under app/api/cron/** — tagged templates
 * parameterize user-influenced values by construction; the Unsafe variants
 * do not, and one "just this once" is all SQL injection needs.
 */
const cronDir = new URL("../../app/api/cron", import.meta.url);

function collectTsFiles(dir: string): string[] {
	const entries = readdirSync(dir, { withFileTypes: true });
	return entries.flatMap((entry) => {
		const full = join(dir, entry.name);
		return entry.isDirectory()
			? collectTsFiles(full)
			: entry.name.endsWith(".ts")
				? [full]
				: [];
	});
}

describe("cron SQL hygiene guard (F-IN-12)", () => {
	const files = collectTsFiles(fileURLToPath(cronDir));
	it("found cron route files to scan", () => {
		assert.ok(files.length > 0, "no cron files discovered — path drift");
	});

	for (const file of files) {
		const short = file.split(/[/\\]app[/\\]/).pop() ?? file;
		it(`uses no raw-unsafe SQL: ${short}`, () => {
			const source = readFileSync(file, "utf8");
			assert.doesNotMatch(source, /\$queryRawUnsafe|\$executeRawUnsafe/);
		});
	}
});
