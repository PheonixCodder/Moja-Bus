const fs = require("fs");
const path = require("path");

function findCountKeys(obj, currentPath, results) {
  currentPath = currentPath || "";
  results = results || [];
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = currentPath ? currentPath + "." + key : key;
    if (typeof value === "string" && value.includes("{count")) {
      results.push({ path: fullPath, value: value });
    } else if (typeof value === "object" && value !== null) {
      findCountKeys(value, fullPath, results);
    }
  }
  return results;
}

const en = require("../messages/en.json");
const fr = require("../messages/fr.json");
const countKeys = findCountKeys(en);

// Group by the key name (last segment) and their templates
const groups = {};
for (const k of countKeys) {
  const lastSeg = k.path.split(".").pop();
  if (!groups[lastSeg]) groups[lastSeg] = [];
  groups[lastSeg].push(k);
}

function getFilesWithKey(keyLastSegment) {
  const results = [];
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const fp = path.join(dir, e.name);
      if (
        e.isDirectory() &&
        !e.name.includes("node_modules") &&
        !e.name.includes(".next") &&
        !e.name !== "scripts" &&
        !e.name.includes("scratch") &&
        !e.name.includes("dist")
      ) {
        walk(fp);
      } else if (
        e.isFile() &&
        (e.name.endsWith(".tsx") || e.name.endsWith(".ts"))
      ) {
        results.push(fp);
      }
    }
  }
  walk(".");
  return results;
}

// For each group of keys sharing the same last segment, find all files using them
const allFiles = getFilesWithKey("");
const allIssues = [];

// Specific keys known to have {count} issues
const specificKeys = [
  "pendingOperators",
  "pendingOperatorsPlural",
  "activeTrips",
  "activeTripsPlural",
  "results",
  "tripCount",
  "seats",
  "passengerCount",
  "intermediateStops",
  "applyFilters",
  "totalFor",
  "seatsLeft",
  "seatsAvailable",
  "stops",
  "stopsPlural",
  "bookingsDesc",
  "pendingVerificationsDesc",
  "bookingsDesc",
  "tripsGenerated",
  "tripsGenerated_plural",
  "daysPerWeek",
  "daysPerWeek_plural",
  "extendSuccess",
  "extendFallback",
  "retireConfirm",
  "scheduleRetired",
  "retireFailed",
  "deleteFailed",
  "deleteSuccess",
  "bookings",
  "bookingsDesc",
  "bookingsCurrent",
  "tripCount",
  "pendingHolds",
  "selected",
  "bulkCheckInResult",
  "bulkCancelResult",
  "exported",
  "refundsCount",
  "confirmedPassengers",
  "checkInAll",
  "tripsNext14",
  "seatCount",
  "guest",
  "guests",
];

// Instead of trying to detect programmatically, do a targeted search
// For each potential key used in t() calls
const allTsxFiles = [];
function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const fp = path.join(dir, e.name);
    if (
      e.isDirectory() &&
      !e.name.includes("node_modules") &&
      !e.name.includes(".next") &&
      !e.name.includes("dist") &&
      !e.name.includes("scratch") &&
      !e.name !== "scripts"
    ) {
      walk(fp);
    } else if (
      e.isFile() &&
      (e.name.endsWith(".tsx") || e.name.endsWith(".ts"))
    ) {
      allTsxFiles.push(fp);
    }
  }
}
walk(".");

// Check the known keys
const knownIssues = [
  // Key, file pattern check, what to look for
];

// Check specific issue: booking-details.tsx t("seats") with ICU plural
const bookingDetails = "features/booking/components/booking-details.tsx";
const seatsKey = countKeys.find(
  (k) => k.path.includes("seats") && k.value.includes("{count, plural"),
);
if (seatsKey) {
  console.log("Key with ICU plural: " + seatsKey.path);
  console.log("  Template: " + seatsKey.value.substring(0, 100));
}

// Check operator bookings view - t("results") with plural
const operatorBookings = "features/operator/views/operator-bookings-view.tsx";
const resultsKey = countKeys.find((k) => k.path.endsWith("results"));
if (resultsKey) {
  console.log("\nKey 'results' with plural: " + resultsKey.path);
  console.log("  Template: " + resultsKey.value.substring(0, 100));
}

// Check operator trips - tripCount with plural
const operatorTrips = countKeys.filter(
  (k) => k.path.includes("trips") && k.path.includes("tripCount"),
);
for (const k of operatorTrips) {
  console.log("\nKey: " + k.path);
  console.log("  Template: " + k.value.substring(0, 100));
}

// Print ALL keys with ICU plural format (most critical)
console.log("\n\n=== ALL ICU PLURAL KEYS (need count param) ===");
const icuPlural = countKeys.filter((k) => k.value.includes("{count, plural"));
for (const k of icuPlural) {
  console.log("  " + k.path + ": " + k.value.substring(0, 120));
}

// Print all keys with simple {count} (non-plural)
console.log("\n=== ALL SIMPLE {count} KEYS ===");
const simpleCount = countKeys.filter(
  (k) =>
    k.value.includes("{count}") &&
    !k.value.includes("{count, plural") &&
    !k.value.includes("{count}.") &&
    !k.value.includes("{count, plural"),
);
// Actually all count keys already include {count}
// Let me just check which ones don't have ICU plural format
const simpleOnly = countKeys.filter((k) => !k.value.includes("{count, plural"));
console.log("Count:", simpleOnly.length);
for (const k of simpleOnly) {
  console.log("  " + k.path + ": " + k.value.substring(0, 100));
}
