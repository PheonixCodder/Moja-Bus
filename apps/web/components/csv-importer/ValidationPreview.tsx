"use client";

import { Alert, AlertDescription } from "@moja/ui/components/ui/alert";
import { Badge } from "@moja/ui/components/ui/badge";
import { Label } from "@moja/ui/components/ui/label";
import { Switch } from "@moja/ui/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@moja/ui/components/ui/table";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useMemo } from "react";
import type {
  ColumnMapping,
  CsvColumnDefinition,
  ParsedCsvData,
  RowValidationResult,
} from "@/lib/csv/types";

interface ValidationPreviewProps {
  parsedData: ParsedCsvData;
  targetColumns: CsvColumnDefinition[];
  mapping: ColumnMapping;
  upsert: boolean;
  onUpsertChange: (upsert: boolean) => void;
  skipInvalid: boolean;
  onSkipInvalidChange: (skipInvalid: boolean) => void;
  onValidationComplete?: (results: RowValidationResult[]) => void;
}

export function ValidationPreview({
  parsedData,
  targetColumns,
  mapping,
  upsert,
  onUpsertChange,
  skipInvalid,
  onSkipInvalidChange,
}: ValidationPreviewProps) {
  // Invert mapping for quick lookup: targetKey -> sourceHeader
  const targetToSource = useMemo(() => {
    const rev: Record<string, string> = {};
    for (const [src, tgt] of Object.entries(mapping)) {
      if (tgt) rev[tgt] = src;
    }
    return rev;
  }, [mapping]);

  // Validate all rows
  const validationResults = useMemo<RowValidationResult[]>(() => {
    return parsedData.records.map((rawRecord, index) => {
      const mappedRecord: Record<string, unknown> = {};
      const errors: Record<string, string> = {};

      for (const col of targetColumns) {
        const sourceHeader = targetToSource[col.key];
        const rawVal = sourceHeader
          ? (rawRecord[sourceHeader] ?? "").trim()
          : "";

        if (col.required && !rawVal) {
          errors[col.key] = `${col.label} is required`;
          continue;
        }

        if (!rawVal) {
          mappedRecord[col.key] = null;
          continue;
        }

        // Type transformations
        if (col.type === "number") {
          const num = Number(rawVal.replace(/[,\s]/g, ""));
          if (Number.isNaN(num)) {
            errors[col.key] = `Must be a valid number`;
          } else {
            mappedRecord[col.key] = num;
          }
        } else if (col.type === "boolean") {
          const lower = rawVal.toLowerCase();
          if (["true", "1", "yes", "oui", "vrai"].includes(lower)) {
            mappedRecord[col.key] = true;
          } else if (["false", "0", "no", "non", "faux"].includes(lower)) {
            mappedRecord[col.key] = false;
          } else {
            mappedRecord[col.key] = Boolean(rawVal);
          }
        } else if (col.type === "enum" && col.options) {
          const upper = rawVal.toUpperCase();
          if (col.options.includes(upper)) {
            mappedRecord[col.key] = upper;
          } else {
            errors[col.key] = `Must be one of: ${col.options.join(", ")}`;
          }
        } else {
          mappedRecord[col.key] = rawVal;
        }
      }

      return {
        rowIndex: index + 1,
        rawRecord,
        mappedRecord,
        isValid: Object.keys(errors).length === 0,
        errors,
      };
    });
  }, [parsedData.records, targetColumns, targetToSource]);

  const validCount = validationResults.filter((r) => r.isValid).length;
  const invalidCount = validationResults.length - validCount;
  const previewRows = validationResults.slice(0, 15);

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-muted/20 p-3">
          <div className="text-xs text-muted-foreground">Total Rows</div>
          <div className="text-xl font-bold">{validationResults.length}</div>
        </div>
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Valid Rows
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {validCount}
          </div>
        </div>
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-3.5 w-3.5" />
            Rows with Issues
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
            {invalidCount}
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="rounded-lg border p-3 space-y-3 bg-muted/10">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label
              htmlFor="upsert-toggle"
              className="text-sm font-medium cursor-pointer"
            >
              Update existing records if match found (Upsert)
            </Label>
            <p className="text-xs text-muted-foreground">
              When enabled, matching records will be updated with the CSV values
              rather than skipped.
            </p>
          </div>
          <Switch
            id="upsert-toggle"
            checked={upsert}
            onCheckedChange={onUpsertChange}
          />
        </div>

        {invalidCount > 0 && (
          <div className="flex items-center justify-between gap-4 pt-2 border-t">
            <div className="space-y-0.5">
              <Label
                htmlFor="skip-invalid"
                className="text-sm font-medium cursor-pointer"
              >
                Skip invalid rows ({invalidCount}) and import valid ones (
                {validCount})
              </Label>
              <p className="text-xs text-muted-foreground">
                Only valid rows will be committed to the database.
              </p>
            </div>
            <Switch
              id="skip-invalid"
              checked={skipInvalid}
              onCheckedChange={onSkipInvalidChange}
            />
          </div>
        )}
      </div>

      {/* Alert if has errors and not skipping */}
      {invalidCount > 0 && !skipInvalid && (
        <Alert variant="destructive" className="py-2.5">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {invalidCount} row(s) contain validation errors. Enable &ldquo;Skip
            invalid rows&rdquo; above to import only the valid rows, or fix your
            CSV and re-upload.
          </AlertDescription>
        </Alert>
      )}

      {/* Preview table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground border-b flex items-center justify-between">
          <span>Data Preview (Showing first {previewRows.length} rows)</span>
          <span>{validCount} ready</span>
        </div>
        <div className="max-h-[280px] overflow-auto">
          <Table className="text-xs">
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead className="w-20">Status</TableHead>
                {targetColumns
                  .filter((col) => targetToSource[col.key])
                  .map((col) => (
                    <TableHead key={col.key} className="whitespace-nowrap">
                      {col.label}
                    </TableHead>
                  ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.map((result) => {
                const mappedCols = targetColumns.filter(
                  (col) => targetToSource[col.key],
                );
                return (
                  <TableRow
                    key={result.rowIndex}
                    className={
                      !result.isValid
                        ? "bg-red-500/5 hover:bg-red-500/10"
                        : "hover:bg-muted/20"
                    }
                  >
                    <TableCell className="text-center font-mono text-muted-foreground">
                      {result.rowIndex}
                    </TableCell>
                    <TableCell>
                      {result.isValid ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-[10px]"
                        >
                          Valid
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-[10px]">
                          Error
                        </Badge>
                      )}
                    </TableCell>
                    {mappedCols.map((col) => {
                      const val = result.mappedRecord[col.key];
                      const err = result.errors[col.key];
                      return (
                        <TableCell
                          key={col.key}
                          className={`max-w-[200px] truncate ${
                            err
                              ? "bg-red-500/10 font-medium text-red-600 dark:text-red-400 border border-red-500/30"
                              : ""
                          }`}
                          title={err ? `Error: ${err}` : String(val ?? "")}
                        >
                          {val !== null && val !== undefined
                            ? String(val)
                            : "-"}
                          {err && (
                            <span className="block text-[10px] text-red-500 mt-0.5">
                              {err}
                            </span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
