const fs = require("fs");
const filePath = "features/search/components/offer-card.tsx";
let content = fs.readFileSync(filePath, "utf8");

// Fix: replace raw {offer.seatClass} with translated version
// Line 78: {offer.seatClass} -> {t("seatClass." + offer.seatClass)}
content = content.replace(
  /{offer\.seatClass}/g,
  "{offer.seatClass ? t(`seatClass.${offer.seatClass}`) : offer.seatClass}",
);

fs.writeFileSync(filePath, content);
console.log("Fixed offer-card.tsx");
