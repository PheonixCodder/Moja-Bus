import type { ColumnMapping, CsvColumnDefinition } from "./types";

/**
 * Normalizes a header or alias string for comparison:
 * Lowercases, strips accents, replaces separators with spaces, removes special chars.
 */
export function normalizeHeader(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics / accents
    .replace(/[-_./\\]/g, " ")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Auto-detects matches between uploaded CSV headers and target schema columns.
 * Matches on:
 * 1. Normalized key equality (e.g. "phone" === "phone")
 * 2. Normalized label equality (e.g. "terminal name" === "terminal name")
 * 3. Normalized alias equality (e.g. "telephone" in aliases)
 * 4. Substring inclusion if unambiguous
 */
export function autoDetectColumnMapping(
  sourceHeaders: string[],
  targetColumns: CsvColumnDefinition[],
): ColumnMapping {
  const mapping: ColumnMapping = {};
  const mappedTargetKeys = new Set<string>();

  // Helper to map
  const assignMapping = (header: string, targetKey: string) => {
    if (!mapping[header] && !mappedTargetKeys.has(targetKey)) {
      mapping[header] = targetKey;
      mappedTargetKeys.add(targetKey);
      return true;
    }
    return false;
  };

  // Pass 1: Exact matches (on key, label, or aliases)
  for (const header of sourceHeaders) {
    const normSource = normalizeHeader(header);
    if (!normSource) continue;

    for (const col of targetColumns) {
      if (mappedTargetKeys.has(col.key)) continue;

      const normKey = normalizeHeader(col.key);
      const normLabel = normalizeHeader(col.label);
      const normAliases = col.aliases.map(normalizeHeader);

      if (
        normSource === normKey ||
        normSource === normLabel ||
        normAliases.includes(normSource)
      ) {
        assignMapping(header, col.key);
        break;
      }
    }
  }

  // Pass 2: Alias inclusion or word overlap
  for (const header of sourceHeaders) {
    if (mapping[header]) continue;
    const normSource = normalizeHeader(header);
    if (!normSource) continue;
    const sourceWords = normSource.split(" ");

    for (const col of targetColumns) {
      if (mappedTargetKeys.has(col.key)) continue;

      const normKey = normalizeHeader(col.key);
      const normLabel = normalizeHeader(col.label);
      const normAliases = col.aliases.map(normalizeHeader);

      // Check if alias matches word in source header
      const aliasMatch = normAliases.some(
        (alias) =>
          sourceWords.includes(alias) ||
          (alias.length > 3 && normSource.includes(alias)),
      );

      if (
        aliasMatch ||
        (normSource.length > 3 && normLabel.includes(normSource)) ||
        (normLabel.length > 3 && normSource.includes(normLabel)) ||
        (normSource.length > 3 && normKey.includes(normSource))
      ) {
        assignMapping(header, col.key);
        break;
      }
    }
  }

  // Ensure every header has an entry (unmapped headers map to "")
  for (const header of sourceHeaders) {
    if (!mapping[header]) {
      mapping[header] = "";
    }
  }

  return mapping;
}
