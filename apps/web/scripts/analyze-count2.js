const fs = require("fs");
const path = require("path");

function findCountKeys(obj, currentPath, results) {
  currentPath = currentPath || "";
  results = results || [];
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = currentPath ? currentPath + "." + key : key;
    if (typeof value === "string" && value.includes("{count")) {
      results.push({ path: fullPath, value: value, lastSegment: key });
    } else if (typeof value === "object" && value !== null) {
      findCountKeys(value, fullPath, results);
    }
  }
  return results;
}

const en = require("../messages/en.json");
const countKeys = findCountKeys(en);

// Build a map: lastSegment -> fullPath (some keys appear in multiple namespaces)
const keysByLastSegment = {};
for (const k of countKeys) {
  const seg = k.lastSegment;
  if (!keysByLastSegment[seg]) keysByLastSegment[seg] = [];
  keysByLastSegment[seg].push(k.path);
}

// Find all t() calls in the codebase
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

// For each file, find t() calls with count keys
const issues = [];

for (const file of files) {
  let content;
  try {
    content = fs.readFileSync(file, "utf8");
  } catch (e) {
    continue;
  }

  const lines = content.split("\n");

  // Track which useTranslations namespace is active at each line
  let currentNamespace = null;
  const namespaceStack = [];

  // Simple approach: for each t() call, check if it uses a key with {count}
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track namespace changes
    const nsMatch = line.match(/useTranslations\(\s*["'`]([^"'`]+)["'`]\s*\)/);
    if (nsMatch) {
      currentNamespace = nsMatch[1];
    }

    // Find t() calls
    const tCallMatch = line.match(/t\s*\(\s*["'`]([^"'`]+)["'`]/);
    if (!tCallMatch) continue;

    const keyUsed = tCallMatch[1];

    // Check if this key has {count} in any namespace
    // For simplicity, check if last segment matches any key with {count}
    for (const countKey of countKeys) {
      if (countKey.lastSegment === keyUsed) {
        // Check if count param is passed in this t() call
        // Look at the next 3 lines for multi-line calls
        let callContext = "";
        for (let j = i; j < Math.min(i + 4, lines.length); j++) {
          callContext += lines[j] + "\n";
        }
        const hasCountParam = /count\s*:/.test(callContext);

        if (!hasCountParam) {
          issues.push({
            fullKey: countKey.path,
            template: countKey.value.substring(0, 80),
            file: file,
            lineNum: i + 1,
            lineContent: line.trim().substring(0, 200),
            namespace: currentNamespace,
          });
        }
        break; // Only report once per call
      }
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

// Sort by file
uniqueIssues.sort(
  (a, b) => a.file.localeCompare(b.file) || a.lineNum - b.lineNum,
);

console.log("=== ISSUES: {count} keys without count parameter ===");
console.log("Total keys with {count}:", countKeys.length);
console.log("Total issues found:", uniqueIssues.length);
console.log("");

// Group by file
const byFile = {};
for (const issue of uniqueIssues) {
  if (!byFile[issue.file]) byFile[issue.file] = [];
  byFile[issue.file].push(issue);
}

const fileCount = Object.keys(byFile).length;
console.log("Affected files:", fileCount);
console.log("");

for (const [file, group] of Object.entries(byFile)) {
  console.log("FILE: " + file);
  for (const issue of group) {
    console.log(
      "  Line " +
        issue.lineNum +
        ': t("' +
        issue.fullKey.split(".").slice(-1)[0] +
        '")',
    );
    console.log("    Template: " + issue.template);
    console.log("    Code: " + issue.lineContent);
  }
  console.log("");
}
