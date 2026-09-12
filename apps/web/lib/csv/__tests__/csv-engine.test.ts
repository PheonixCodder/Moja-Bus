import assert from "node:assert/strict";
import test from "node:test";
import { autoDetectColumnMapping, normalizeHeader } from "../fuzzy-matcher";
import { parseCsv, stringifyCsv } from "../parser";
import { generateSampleCsv, TERMINALS_CSV_TEMPLATE } from "../templates";

test("CSV Parser parses simple CSV lines correctly", () => {
  const input =
    "Name,City,Phone\nAdjamé,Abidjan,+2250700000001\nBouaké,Bouaké,+2250700000002";
  const result = parseCsv(input);

  assert.equal(result.headers.length, 3);
  assert.deepEqual(result.headers, ["Name", "City", "Phone"]);
  assert.equal(result.records.length, 2);
  // biome-ignore lint/complexity/useLiteralKeys: TS noPropertyAccessFromIndexSignature
  assert.equal(result.records[0]?.["Name"], "Adjamé");
  // biome-ignore lint/complexity/useLiteralKeys: TS noPropertyAccessFromIndexSignature
  assert.equal(result.records[0]?.["City"], "Abidjan");
  // biome-ignore lint/complexity/useLiteralKeys: TS noPropertyAccessFromIndexSignature
  assert.equal(result.records[1]?.["Name"], "Bouaké");
});

test("CSV Parser handles quoted fields and commas inside quotes", () => {
  const input =
    'Name,Address,Notes\n"Gare Centrale, Adjamé","Rue 12, Face Marché","Air conditioning, VIP lounge"\n';
  const result = parseCsv(input);

  assert.equal(result.records.length, 1);
  // biome-ignore lint/complexity/useLiteralKeys: TS noPropertyAccessFromIndexSignature
  assert.equal(result.records[0]?.["Name"], "Gare Centrale, Adjamé");
  // biome-ignore lint/complexity/useLiteralKeys: TS noPropertyAccessFromIndexSignature
  assert.equal(result.records[0]?.["Address"], "Rue 12, Face Marché");
  // biome-ignore lint/complexity/useLiteralKeys: TS noPropertyAccessFromIndexSignature
  assert.equal(result.records[0]?.["Notes"], "Air conditioning, VIP lounge");
});

test("CSV Parser handles escaped quotes within quotes", () => {
  const input = 'Name,Description\n"Test Station","The ""Best"" Station"\n';
  const result = parseCsv(input);

  assert.equal(result.records.length, 1);
  // biome-ignore lint/complexity/useLiteralKeys: TS noPropertyAccessFromIndexSignature
  assert.equal(result.records[0]?.["Description"], 'The "Best" Station');
});

test("CSV Parser strips UTF-8 BOM", () => {
  const input = "\uFEFFName,City\nStation A,Abidjan";
  const result = parseCsv(input);

  assert.equal(result.headers[0], "Name");
  // biome-ignore lint/complexity/useLiteralKeys: TS noPropertyAccessFromIndexSignature
  assert.equal(result.records[0]?.["Name"], "Station A");
});

test("Stringify CSV escapes cells with commas or quotes", () => {
  const headers = ["Name", "Description"];
  const rows = [
    { Name: "Station, A", Description: 'Has "VIP" lounge' },
    { Name: "Normal", Description: "Simple" },
  ];

  const csv = stringifyCsv(headers, rows);
  assert.match(csv, /"Station, A"/);
  assert.match(csv, /"Has ""VIP"" lounge"/);
  assert.match(csv, /Normal,Simple/);
});

test("Fuzzy matcher normalizes accents and case", () => {
  assert.equal(normalizeHeader("Gare d'Adjamé"), "gare dadjame");
  assert.equal(normalizeHeader("TÉLÉPHONE / CONTACT"), "telephone contact");
  assert.equal(normalizeHeader("Date_Debut"), "date debut");
});

test("Fuzzy matcher auto-detects column mapping correctly", () => {
  const headers = [
    "Nom de la gare",
    "Ville",
    "Adresse",
    "Numéro Téléphone",
    "Random Unrelated",
  ];

  const mapping = autoDetectColumnMapping(
    headers,
    TERMINALS_CSV_TEMPLATE.columns,
  );

  assert.equal(mapping["Nom de la gare"], "name");
  // biome-ignore lint/complexity/useLiteralKeys: TS noPropertyAccessFromIndexSignature
  assert.equal(mapping["Ville"], "city");
  // biome-ignore lint/complexity/useLiteralKeys: TS noPropertyAccessFromIndexSignature
  assert.equal(mapping["Adresse"], "addressLine1");
  assert.equal(mapping["Numéro Téléphone"], "phone");
  assert.equal(mapping["Random Unrelated"], "");
});

test("Generate sample CSV creates valid CSV with headers and sample rows", () => {
  const csv = generateSampleCsv(TERMINALS_CSV_TEMPLATE);
  const parsed = parseCsv(csv);

  assert.equal(parsed.headers.length, TERMINALS_CSV_TEMPLATE.columns.length);
  assert.equal(parsed.records.length, TERMINALS_CSV_TEMPLATE.sampleRows.length);
  // biome-ignore lint/complexity/useLiteralKeys: TS noPropertyAccessFromIndexSignature
  assert.equal(parsed.records[0]?.["Terminal Name"], "Gare Centrale Adjamé");
});
