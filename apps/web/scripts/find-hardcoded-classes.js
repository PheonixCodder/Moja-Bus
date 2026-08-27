const fs = require("fs");
function walk(dir, files) {
  files = files || [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const fp = dir + "/" + e.name;
    if (e.isDirectory()) {
      if (
        !e.name.includes("node_modules") &&
        !e.name.includes(".next") &&
        !e.name.includes("dist") &&
        !e.name.includes("scratch") &&
        e.name !== "scripts" &&
        e.name !== ".git"
      ) {
        walk(fp, files);
      }
    } else if (
      e.isFile() &&
      (e.name.endsWith(".tsx") || e.name.endsWith(".ts"))
    ) {
      files.push(fp);
    }
  }
  return files;
}
const files = walk(".");
const classNames = ["EXPRESS", "STANDARD", "VIP"];
for (const f of files) {
  try {
    const content = fs.readFileSync(f, "utf8");
    for (const cn of classNames) {
      if (content.includes(cn)) {
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(cn)) {
            console.log(
              f +
                ":" +
                (i + 1) +
                " [" +
                cn +
                "]: " +
                lines[i].trim().substring(0, 200),
            );
          }
        }
      }
    }
  } catch (e) {}
}
