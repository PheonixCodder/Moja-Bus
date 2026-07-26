const fs = require("fs");
const c = fs.readFileSync("features/operator/components/fleet/add-bus-drawer.tsx", "utf8");
const lines = c.split("\n");
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("seatClass") && (lines[i].includes("{") || lines[i].includes("?? "))) {
    console.log("Line " + (i+1) + ": " + lines[i].trim().substring(0, 200));
  }
}
console.log("Has useTranslations:", c.includes("useTranslations"));
