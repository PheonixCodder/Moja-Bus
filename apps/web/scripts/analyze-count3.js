const fs = require("fs");
const path = require("path");

function findCountKeys(obj, currentPath, results) {
  currentPath = currentPath || "";
  results = results || [];
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = currentPath ? currentPath + "." + key : key;
    if (typeof value === "string" && value.includes("{count")) {
      results.push({ path: fullPath, value: value });
    } else if (typeof value === "object" && value !== null) {
      findCountKeys(value, fullPath, results);
    }
  }
  return results;
}

const en = require("../messages/en.json");
const countKeys = findCountKeys(en);

// Build a set of all full key paths
const countKeyPaths = new Set(countKeys.map((k) => k.path));

// Build: namespace -> keys in that namespace
// useTranslations("namespace") makes t("key") resolve to namespace.key
// So for each t("key") call, we need to know the current namespace

function findJsTsFiles(dir, results) {
  results = results || [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        !entry.name.includes("node_modules") &&
        !entry.name.includes(".next") &&
        !entry.name.includes("dist") &&
        !entry.name.includes("scratch") &&
        !entry.name.includes("scripts")
      ) {
        findJsTsFiles(fullPath, results);
      }
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))
    ) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = findJsTsFiles(".");
const issues = [];

for (const file of files) {
  let content;
  try {
    content = fs.readFileSync(file, "utf8");
  } catch (e) {
    continue;
  }

  const lines = content.split("\n");
  let currentNamespace = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track namespace
    const nsMatch = line.match(/useTranslations\(\s*["'`]([^"'`]+)["'`]\s*\)/);
    if (nsMatch) {
      currentNamespace = nsMatch[1];
    }

    // Find t("key") calls with simple keys (not dots, not function references)
    const tMatch = line.match(
      /t\s*\(\s*["'`]([a-zA-Z][a-zA-Z0-9]*)["'`]\s*[\),]/,
    );
    if (!tMatch) continue;

    const keyName = tMatch[1];

    // Check if namespace.key has {count}
    if (!currentNamespace) continue;
    const fullKey = currentNamespace + "." + keyName;
    if (!countKeyPaths.has(fullKey)) continue;

    // Check if count param is passed
    let callContext = lines[i];
    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
      callContext += "\n" + lines[j];
      // Stop if we've closed the t() call
      if (
        lines[j].includes(")") &&
        !lines[j].includes("||") &&
        !lines[j].includes("&&")
      )
        break;
    }

    const hasCountParam = /count\s*:/.test(callContext);

    if (!hasCountParam) {
      issues.push({
        fullKey: fullKey,
        template:
          countKeys.find((k) => k.path === fullKey)?.value?.substring(0, 80) ||
          "",
        file: file,
        lineNum: i + 1,
        lineContent: line.trim().substring(0, 200),
      });
    }
  }
}

// Deduplicate
const seen = new Set();
const uniqueIssues = issues.filter((issue) => {
  const sig = issue.fullKey + "|" + issue.file + "|" + issue.lineNum;
  if (seen.has(sig)) return false;
  seen.add(sig);
  return true;
});

uniqueIssues.sort(
  (a, b) => a.file.localeCompare(b.file) || a.lineNum - b.lineNum,
);

console.log("=== {count} keys without count parameter passed ===");
console.log("Total issues:", uniqueIssues.length);
console.log("");

// Also check t() calls with keys that have ICU plural format
console.log("=== Also checking ICU plural keys ---");
const icuPluralKeys = countKeys.filter((k) =>
  k.value.includes("{count, plural"),
);
console.log(
  "ICU plural keys:",
  icuPluralKeys.map((k) => k.path),
);
console.log("");

for (const issue of uniqueIssues) {
  console.log("---");
  console.log("Full key:", issue.fullKey);
  console.log("Template:", issue.template);
  console.log("File:", issue.file + ":" + issue.lineNum);
  console.log("Code:", issue.lineContent.substring(0, 150));
  console.log("");
}
