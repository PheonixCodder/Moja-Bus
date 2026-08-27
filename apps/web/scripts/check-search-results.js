const fs = require("fs");
const content = fs.readFileSync(
  "features/search/components/search-results.tsx",
  "utf8",
);
const idx = content.indexOf("busType");
if (idx >= 0) {
  console.log("Found busType in search-results.tsx:");
  console.log(content.substring(Math.max(0, idx - 200), idx + 300));
} else {
  console.log("No busType found in search-results.tsx");
}

// Also check offer-card
const offerCard = fs.readFileSync(
  "features/search/components/offer-card.tsx",
  "utf8",
);
console.log("\n=== offer-card.tsx seatClass display ===");
const lines = offerCard.split("\n");
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("seatClass") && lines[i].includes("{offer.seatClass")) {
    console.log("Line " + (i + 1) + ": " + lines[i].trim());
  }
  if (lines[i].includes("isExpress") && lines[i].includes("{offer.isExpress")) {
    console.log("Line " + (i + 1) + ": " + lines[i].trim());
  }
  if (lines[i].includes("busTypeName")) {
    console.log("Line " + (i + 1) + ": " + lines[i].trim().substring(0, 150));
  }
}
