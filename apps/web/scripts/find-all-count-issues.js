const fs = require("fs");
const path = require("path");

function walk(dir, files) {
  files = files || [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!e.name.includes("node_modules") && !e.name.includes(".next") && !e.name.includes("dist") && !e.name.includes("scratch") && !e.name.includes("scripts") && e.name !== "scripts" && e.name !== ".git") {
        walk(fp, files);
      }
    } else if (e.isFile() && (e.name.endsWith(".tsx") || e.name.endsWith(".ts"))) {
      files.push(fp);
    }
  }
  return files;
}

const files = walk(".");
const en = require("../messages/en.json");
const fr = require("../messages/fr.json");

function getAllCountKeys(obj, currentPath, results) {
  currentPath = currentPath || "";
  results = results || [];
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = currentPath ? currentPath + "." + key : key;
    if (typeof value === "string" && value.includes("{count")) {
      results.push({ path: fullPath, value: value });
    } else if (typeof value === "object" && value !== null) {
      getAllCountKeys(value, fullPath, results);
    }
  }
  return results;
}

const countKeys = getAllCountKeys(en);

// Build a map from the last segment of the key to the full path
const keysByLastSegment = {};
for (const k of countKeys) {
  const lastSeg = k.path.split(".").pop();
  if (!keysByLastSegment[lastSeg]) keysByLastSegment[lastSeg] = [];
  keysByLastSegment[lastSeg].push(k);
}

// Now for each file, find all t("key") calls and check
// if the key has a {count} placeholder and if count is passed

const allIssues = [];

for (const file of files) {
  let content;
  try {
    content = fs.readFileSync(file, "utf8");
  } catch (e) {
    continue;
  }

  // Track active namespace
  const lines = content.split("\n");
  let currentNamespace = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track useTranslations namespace
    const nsMatch = line.match(/useTranslations\(\s*["'`]([^"'`]+)["'`]\s*\)/);
    if (nsMatch) {
      currentNamespace = nsMatch[1];
    }

    // Find t("key") calls - simple keys
    // Match: t("key") or t('key') or t(`key`)
    const simpleTCall = line.match(/t\s*\(\s*["'`]([a-zA-Z_][a-zA-Z0-9_]*)["'`]\s*\)/);
    if (simpleTCall) {
      const keyName = simpleTCall[1];
      if (!currentNamespace) continue;
      if (keysByLastSegment[keyName]) {
        for (const ck of keysByLastSegment[keyName]) {
          if (ck.path.startsWith(currentNamespace + ".")) {
            // Check count parameter
            let context = lines[i];
            for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
              context += "\n" + lines[j];
              if (lines[j].includes(")") && !lines[j].includes("||") && !lines[j].includes("&&") && !lines[j].includes("?")) break;
            }
            const hasCount = /count\s*:/.test(context);
            if (!hasCount) {
              allIssues.push({
                key: ck.path,
                template: ck.value.substring(0, 100),
                file: file,
                lineNum: i + 1,
                code: line.trim().substring(0, 150),
              });
            }
            break;
          }
        }
      }
    }

    // Find t("key", { ... }) calls - check for count parameter
    const tCallWithArgs = line.match(/t\s*\(\s*["'`]([a-zA-Z_][a-zA-Z0-9_]*)["'`]\s*,\s*\{/);
    if (tCallWithArgs) {
      const keyName = tCallWithArgs[1];
      if (!currentNamespace) continue;
      if (keysByLastSegment[keyName]) {
        for (const ck of keysByLastSegment[keyName]) {
          if (ck.path.startsWith(currentNamespace + ".")) {
            // Already has args, check for count
            let context = lines[i];
            for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
              context += "\n" + lines[j];
              if (lines[j].includes(")") && !lines[j].includes("||") && !lines[j].includes("&&") && !lines[j].includes("?")) break;
            }
            // If no count found, this could be an issue but less likely
            // since they're already using the second arg pattern
            break;
          }
        }
      }
    }
  }
}

// Deduplicate
const seen = new Set();
const uniqueIssues = allIssues.filter((issue) => {
  const sig = issue.key + "|" + issue.file + "|" + issue.lineNum;
  if (seen.has(sig)) return false;
  seen.add(sig);
  return true;
});

uniqueIssues.sort((a, b) => a.file.localeCompare(b.file) || a.lineNum - b.lineNum);

console.log("=== {count} keys without count parameter ===");
console.log("Total issues:", uniqueIssues.length);
console.log("");

// Group by key
const byKey = {};
for (const issue of uniqueIssues) {
  if (!byKey[issue.key]) byKey[issue.key] = [];
  byKey[issue.key].push(issue);
}

for (const [key, group] of Object.entries(byKey)) {
  console.log("=== Key: " + key + " ===");
  console.log("Template: " + group[0].template);
  console.log("Occurrences: " + group.length);
  for (const issue of group) {
    console.log("  " + issue.file + ":" + issue.lineNum);
    console.log("    " + issue.code);
  }
  console.log("");
}
