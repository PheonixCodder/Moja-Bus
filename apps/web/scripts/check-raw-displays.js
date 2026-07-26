const fs = require("fs");

// Check trip-summary-card.tsx busTypeName display
const tsFile = "features/booking/components/trip-summary-card.tsx";
try {
  const content = fs.readFileSync(tsFile, "utf8");
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes("busTypeName") || (line.includes("seatClass") && line.includes("{"))) {
      console.log(tsFile + ":" + (i+1) + ": " + line.substring(0, 200));
    }
  }
} catch(e) {}

console.log("");

// Check add-bus-modal.tsx hardcoded labels
const addBusModal = "features/operator/components/add-bus-modal.tsx";
try {
  const content = fs.readFileSync(addBusModal, "utf8");
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if ((line.includes("Standard") && line.includes("label")) || (line.includes("STANDARD") && line.includes("label"))) {
      console.log(addBusModal + ":" + (i+1) + ": " + line.substring(0, 200));
    }
  }
} catch(e) {}

console.log("");

// Check add-bus-drawer.tsx seatClass display
const addBusDrawer = "features/operator/components/fleet/add-bus-drawer.tsx";
try {
  const content = fs.readFileSync(addBusDrawer, "utf8");
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes("layout.seatClass")) {
      console.log(addBusDrawer + ":" + (i+1) + ": " + line.substring(0, 200));
    }
  }
} catch(e) {}

// Check operator fleet view busType.name display
const opFleet = "features/operator/views/operator-fleet-view.tsx";
try {
  const content = fs.readFileSync(opFleet, "utf8");
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes("busType.name") && (line.includes("{") || line.includes("="))) {
      console.log(opFleet + ":" + (i+1) + ": " + line.substring(0, 200));
    }
  }
} catch(e) {}
