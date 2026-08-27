const fs = require("fs");
const c = fs.readFileSync(
  "features/operator/components/add-bus-modal.tsx",
  "utf8",
);
const lines = c.split("\n");
for (let i = 310; i < 335; i++) {
  console.log(i + 1 + ": " + lines[i]);
}
