const fs = require("fs");
const c = fs.readFileSync(
  "features/operator/components/add-bus-modal.tsx",
  "utf8",
);
const lines = c.split("\n").slice(0, 15);
lines.forEach((l, i) => console.log(i + 1 + ": " + l));
console.log("---");
// Check if useTranslations is imported
console.log("Has useTranslations:", c.includes("useTranslations"));
