const en = require("../messages/en.json");
const fr = require("../messages/fr.json");

function findCountPlaceholders(obj, path = "", results = []) {
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? path + "." + key : key;
    if (typeof value === "string" && value.includes("{count}")) {
      results.push({ path: currentPath, en: value });
    } else if (typeof value === "object" && value !== null) {
      findCountPlaceholders(value, currentPath, results);
    }
  }
  return results;
}

function findPluralPlaceholders(obj, path = "", results = []) {
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? path + "." + key : key;
    if (typeof value === "string" && value.includes("{count, plural")) {
      results.push({ path: currentPath, en: value });
    } else if (typeof value === "object" && value !== null) {
      findPluralPlaceholders(value, currentPath, results);
    }
  }
  return results;
}

const enCountResults = findCountPlaceholders(en);
const frCountResults = findCountPlaceholders(fr);
const enPluralResults = findPluralPlaceholders(en);
const frPluralResults = findPluralPlaceholders(fr);

const enPaths = new Set(enCountResults.map((r) => r.path));
const frPaths = new Set(frCountResults.map((r) => r.path));

console.log(
  "=== EN keys with {count} placeholder (" + enCountResults.length + ") ===",
);
enCountResults.forEach((r) =>
  console.log("  " + r.path + ": " + JSON.stringify(r.en)),
);

console.log(
  "\n=== Keys in EN but NOT in FR (" +
    [...enPaths].filter((p) => !frPaths.has(p)).length +
    ") ===",
);
[...enPaths]
  .filter((p) => !frPaths.has(p))
  .forEach((p) => console.log("  " + p));

console.log(
  "\n=== Keys in FR but NOT in EN (" +
    [...frPaths].filter((p) => !enPaths.has(p)).length +
    ") ===",
);
[...frPaths]
  .filter((p) => !enPaths.has(p))
  .forEach((p) => console.log("  " + p));

console.log(
  "\n=== EN keys with ICU plural ({count, plural}) (" +
    enPluralResults.length +
    ") ===",
);
enPluralResults.forEach((r) =>
  console.log("  " + r.path + ": " + JSON.stringify(r.en)),
);
