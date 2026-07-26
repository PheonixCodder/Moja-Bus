const fs = require("fs");
const files = [
  "features/operator/views/operator-dashboard-view.tsx",
];
for (const f of files) {
  try {
    const content = fs.readFileSync(f, "utf8");
    const idx = content.indexOf("bookingsDesc");
    if (idx >= 0) {
      const start = Math.max(0, idx - 300);
      const end = Math.min(content.length, idx + 300);
      console.log("=== " + f + " ===");
      console.log(content.substring(start, end));
      console.log("");
    }
  } catch(e) {}
}
