const fs = require("fs");
const c = fs.readFileSync(
  "features/operator/components/add-bus-modal.tsx",
  "utf8",
);
const hasUseTrans = c.includes("useTranslations");
const hasT = c.includes("const t = useTranslations");
console.log("Has import:", hasUseTrans);
console.log("Has t variable:", hasT);
// Find first "useTranslations" usage
const lines = c.split("\n");
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("useTranslations") || lines[i].includes("const t")) {
    console.log("Line " + (i + 1) + ": " + lines[i].trim().substring(0, 100));
  }
}
