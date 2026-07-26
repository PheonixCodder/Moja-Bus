const fs = require("fs");
const e = JSON.parse(fs.readFileSync("messages/en.json","utf8"));
console.log("seatClass:", JSON.stringify(e.common.seatClass));
console.log("search.busType:", JSON.stringify(e.search?.busType || "not found"));
console.log("seatClass keys:", Object.keys(e.common.seatClass || {}));
