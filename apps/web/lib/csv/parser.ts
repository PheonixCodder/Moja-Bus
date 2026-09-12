import type { ParsedCsvData } from "./types";

/**
 * Parses raw CSV/TSV text into an array of lines and tokens,
 * properly handling quotes, double-quote escaping, and newlines.
 */
export function parseCsvTokens(text: string, delimiter = ","): string[][] {
  // Strip BOM if present
  const cleanedText = text.startsWith("\uFEFF") ? text.slice(1) : text;
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentToken = "";
  let inQuotes = false;

  for (let i = 0; i < cleanedText.length; i++) {
    const char = cleanedText[i];
    const nextChar = cleanedText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentToken += '"';
          i++; // Skip next quote
        } else {
          // End of quoted block
          inQuotes = false;
        }
      } else {
        currentToken += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        currentRow.push(currentToken.trim());
        currentToken = "";
      } else if (char === "\r") {
        if (nextChar === "\n") {
          i++; // Skip \n
        }
        currentRow.push(currentToken.trim());
        rows.push(currentRow);
        currentRow = [];
        currentToken = "";
      } else if (char === "\n") {
        currentRow.push(currentToken.trim());
        rows.push(currentRow);
        currentRow = [];
        currentToken = "";
      } else {
        currentToken += char;
      }
    }
  }

  // Final token / row if any
  if (currentToken.length > 0 || currentRow.length > 0) {
    currentRow.push(currentToken.trim());
    rows.push(currentRow);
  }

  // Filter out empty rows (e.g. trailing blank lines)
  return rows.filter((row) => row.some((cell) => cell.length > 0));
}

/**
 * Detect delimiter (comma, semicolon, tab) from the header row.
 */
export function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r\n|\n|\r/)[0] || "";
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  if (semicolonCount > commaCount && semicolonCount > tabCount) return ";";
  if (tabCount > commaCount && tabCount > semicolonCount) return "\t";
  return ",";
}

/**
 * Parses full CSV string into structured headers and records.
 */
export function parseCsv(text: string): ParsedCsvData {
  const delimiter = detectDelimiter(text);
  const rawRows = parseCsvTokens(text, delimiter);

  if (rawRows.length === 0) {
    return { headers: [], rawRows: [], records: [] };
  }

  const firstRow = rawRows[0];
  if (!firstRow) {
    return { headers: [], rawRows: [], records: [] };
  }
  const headers = firstRow.map((h) => h.trim());
  const dataRows = rawRows.slice(1);

  const records = dataRows.map((row) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = row[index] ?? "";
    });
    return record;
  });

  return {
    headers,
    rawRows: dataRows,
    records,
  };
}

/**
 * Escapes a cell value for CSV output.
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (
    str.includes(",") ||
    str.includes(";") ||
    str.includes("\n") ||
    str.includes("\r") ||
    str.includes('"')
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Formats headers and record objects into a standard CSV string.
 */
export function stringifyCsv(
  headers: string[],
  rows: Array<Record<string, unknown> | unknown[]>,
): string {
  const headerLine = headers.map(escapeCsvCell).join(",");
  const dataLines = rows.map((row) => {
    if (Array.isArray(row)) {
      return row.map(escapeCsvCell).join(",");
    }
    return headers.map((h) => escapeCsvCell(row[h])).join(",");
  });

  return [headerLine, ...dataLines].join("\n");
}
