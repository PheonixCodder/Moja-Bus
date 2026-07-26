const fs = require("fs");
const path = require("path");

function walk(dir, files) {
  files = files || [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const fp = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (!e.name.includes("node_modules") && !e.name.includes(".next") && !e.name.includes("dist") && !e.name.includes("scratch") && e.name !== "scripts" && e.name !== ".git") {
          walk(fp, files);
        }
      } else if (e.isFile() && (e.name.endsWith(".tsx") || e.name.endsWith(".ts"))) {
        files.push(fp);
      }
    }
  } catch(e) {}
  return files;
}

const files = walk(".");

// Search for raw bus type / seat class display patterns
const patterns = [
  "offer.busTypeName",
  "busTypeName",
  "offer.seatClass",
  "trip.seatClass",
  "bus.seatClass",
  ".seatClass",
  "isExpress &&",
  "busType.name",
];

for (const file of files) {
  try {
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pattern of patterns) {
        if (line.includes(pattern)) {
          // Check if it's inside a {t(...)} call, or a raw display
          const trimmed = line.trim();
          if (trimmed.includes("t(`seatClass") || trimmed.includes("t(\"seatClass") || trimmed.includes("t('seatClass")) {
            continue; // Already translated
          }
          if (trimmed.includes("t(`bus") || trimmed.includes("t(\"bus") || trimmed.includes("t('bus")) {
            continue; // Already translated
          }
          if (trimmed.includes("t(") && trimmed.includes(".")) {
            continue; // Likely translated
          }
          // Skip type definitions and CSS classes
          if (trimmed.startsWith("type ") || trimmed.startsWith("const ") || trimmed.startsWith("let ") || trimmed.startsWith("var ")) {
            continue;
          }
          if (trimmed.includes(": \"") && trimmed.includes("seatClass")) continue;
          if (trimmed.includes("className") || trimmed.includes("style=")) continue;
          if (trimmed.includes("value=") && trimValue.includes("seatClass")) continue;

          console.log(file + ":" + (i+1) + ": " + trimmed.substring(0, 200));
          break;
        }
      }
    }
  } catch(e) {}
}
