import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const en = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../locales/en.json"), "utf8"),
);
const fr = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../locales/fr.json"), "utf8"),
);

function getKeys(obj: Record<string, any>, prefix = ""): string[] {
  return Object.keys(obj).flatMap((key) => {
    const val = obj[key];
    const newPrefix = prefix ? `${prefix}.${key}` : key;
    return typeof val === "object" && val !== null
      ? getKeys(val, newPrefix)
      : [newPrefix];
  });
}

test("i18n key parity between en and fr", () => {
  const enKeys = new Set(getKeys(en));
  const frKeys = new Set(getKeys(fr));

  const missingInFr = [...enKeys].filter((k) => !frKeys.has(k));
  const missingInEn = [...frKeys].filter((k) => !enKeys.has(k));

  assert.equal(
    missingInFr.length,
    0,
    `Keys missing in fr.json: ${missingInFr.join(", ")}`,
  );
  assert.equal(
    missingInEn.length,
    0,
    `Keys missing in en.json: ${missingInEn.join(", ")}`,
  );
});

test("fr.json contains zero corrupted mojibake characters", () => {
  const rawFr = JSON.stringify(fr);
  assert.equal(rawFr.includes("\uFFFD"), false, "fr.json contains \\uFFFD replacement character");
  assert.equal(rawFr.includes("Ǹ"), false, "fr.json contains Ǹ character");
});
