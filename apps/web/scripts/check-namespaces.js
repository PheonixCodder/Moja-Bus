const fs = require("fs");
const e = JSON.parse(fs.readFileSync("messages/en.json", "utf8"));
const operator = e.operator || {};
console.log(Object.keys(operator).join(", "));
