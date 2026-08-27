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

function findJsTsFiles(dir, results) {
  results = results || [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (
      entry.isDirectory() &&
      !entry.name.includes("node_modules") &&
      !entry.name.includes(".next") &&
      !entry.name.includes("dist") &&
      !entry.name.includes("scratch") &&
      !entry.name.includes("scripts")
    ) {
      findJsTsFiles(fullPath, results);
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

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const issues = [];

for (const keyInfo of countKeys) {
  const key = keyInfo.path;
  const escapedKey = escapeRegex(key);

  for (const file of files) {
    let content;
    try {
      content = fs.readFileSync(file, "utf8");
    } catch (e) {
      continue;
    }

    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const tCallMatch = line.match(
        new RegExp("t\\s*\\(\\s*[\"'\x60]" + escapedKey + "[\"'\x60]"),
      );
      if (!tCallMatch) continue;

      // Check if count param is present in this call (check next 5 lines for multi-line calls)
      let context = "";
      for (let j = i; j < Math.min(i + 5, lines.length); j++) {
        context += lines[j] + "\n";
      }
      const hasCountParam = /count\s*:/.test(context);

      if (!hasCountParam) {
        issues.push({
          key: key,
          messageValue: keyInfo.value,
          file: file,
          lineNum: i + 1,
          lineContent: line.trim().substring(0, 200),
        });
      }
    }
  }
}

// Deduplicate
const seen = new Set();
const uniqueIssues = issues.filter((issue) => {
  const sig = issue.key + "|" + issue.file + "|" + issue.lineNum;
  if (seen.has(sig)) return false;
  seen.add(sig);
  return true;
});

console.log(
  "=== ISSUES: Keys with {count} placeholder but no count parameter passed ===",
);
console.log("Total keys with {count}:", countKeys.length);
console.log("Total issues found:", uniqueIssues.length);
console.log("");

// Group by key
const grouped = {};
for (const issue of uniqueIssues) {
  if (!grouped[issue.key]) grouped[issue.key] = [];
  grouped[issue.key].push(issue);
}

for (const [key, group] of Object.entries(grouped)) {
  console.log("--- Key: " + key + " ---");
  console.log("  Template: " + group[0].messageValue.substring(0, 100));
  console.log("  Occurrences: " + group.length);
  for (const issue of group) {
    console.log("  " + issue.file + ":" + issue.lineNum);
    console.log("    " + issue.lineContent.substring(0, 150));
  }
  console.log("");
}
