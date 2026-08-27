const fs = require("fs");
const c = fs.readFileSync(
  "features/operator/components/add-bus-modal.tsx",
  "utf8",
);
const lines = c.split("\n");
for (let i = 0; i < lines.length; i++) {
  if (
    lines[i].includes("AddBusModal") ||
    lines[i].includes("export function")
  ) {
    console.log(i + 1 + ": " + lines[i].trim().substring(0, 120));
  }
}
console.log("---");
console.log(
  "useTranslations imported:",
  c.includes("import { useTranslations }"),
);
console.log(
  "t = useTranslations defined:",
  c.includes("const t = useTranslations"),
);
