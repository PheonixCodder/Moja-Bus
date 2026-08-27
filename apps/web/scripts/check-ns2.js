const fs = require("fs");
const e = JSON.parse(fs.readFileSync("messages/en.json", "utf8"));
console.log("Top-level keys:", Object.keys(e).sort().join(", "));
console.log("Has 'operator':", "operator" in e);
console.log("Has 'adminDashboard':", "adminDashboard" in e);
