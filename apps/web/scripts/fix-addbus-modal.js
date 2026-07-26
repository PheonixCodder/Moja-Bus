const fs = require("fs");
const filePath = "features/operator/components/add-bus-modal.tsx";
let content = fs.readFileSync(filePath, "utf8");

// Find the first "use client" or first function body start after imports
// Add t = useTranslations call after the existing imports
// Insert after "import { toast } from \"sonner\";" line

const importMarker = 'import { toast } from "sonner";';
const tImport = 'import { toast } from "sonner";\nimport { useTranslations } from "next-intl";';

// Check if useTranslations is already imported (it shouldn't be)
if (!content.includes("useTranslations")) {
  console.log("useTranslations not found, adding import");
  // Find the component function and add t setup after the first useState or similar
  // Actually let's just add it at the component level
}

// Find the function body start for AddBusModal
// Add t setup after the first const/state inside the function
const componentStart = content.indexOf("export function AddBusModal");
console.log("Component starts at:", componentStart);

// Find the first useState or const after componentStart
const firstUseState = content.indexOf("const [", componentStart);
console.log("First useState at:", firstUseState);
const beforeUseState = content.substring(componentStart, firstUseState);
console.log("Context:", beforeUseState.substring(0, 300));

// Now replace the hardcoded labels
content = content.replace(
  '{ value: "STANDARD", label: "Standard" },\n                      { value: "VIP", label: "VIP" },\n                      { value: "ECONOMY", label: "Economy" },',
  '{ value: "STANDARD", label: t("seatClass.STANDARD") },\n                      { value: "VIP", label: t("seatClass.VIP") },\n                      { value: "ECONOMY", label: t("seatClass.ECONOMY") },'
);

content = content.replace(
  '<ComboboxItem value="STANDARD">Standard</ComboboxItem>\n                      <ComboboxItem value="VIP">VIP</ComboboxItem>\n                      <ComboboxItem value="ECONOMY">Economy</ComboboxItem>',
  '<ComboboxItem value="STANDARD">{t("seatClass.STANDARD")}</ComboboxItem>\n                      <ComboboxItem value="VIP">{t("seatClass.VIP")}</ComboboxItem>\n                      <ComboboxItem value="ECONOMY">{t("seatClass.ECONOMY")}</ComboboxItem>'
);

fs.writeFileSync(filePath, content);
console.log("Done fixing add-bus-modal.tsx");
