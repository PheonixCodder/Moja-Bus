export type CsvFieldType = "string" | "number" | "boolean" | "enum";

export interface CsvColumnDefinition {
  key: string;
  label: string;
  required: boolean;
  description: string;
  aliases: string[];
  exampleValue: string;
  type?: CsvFieldType;
  options?: string[];
}

export interface CsvTemplateConfig {
  id: "terminals" | "fleet" | "routes" | "schedules";
  entityName: string;
  filename: string;
  columns: CsvColumnDefinition[];
  sampleRows: Record<string, string>[];
}

export interface ParsedCsvData {
  headers: string[];
  rawRows: string[][];
  records: Record<string, string>[];
}

export type ColumnMapping = Record<string, string>; // sourceHeader -> targetFieldKey (or "" if unmapped)

export interface RowValidationResult {
  rowIndex: number;
  rawRecord: Record<string, string>;
  mappedRecord: Record<string, unknown>;
  isValid: boolean;
  errors: Record<string, string>; // targetFieldKey -> errorMessage
}

export interface ImportSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  createdCount?: number | undefined;
  updatedCount?: number | undefined;
  skippedCount?: number | undefined;
  errors?: Array<{ row: number; reason: string }> | undefined;
}
