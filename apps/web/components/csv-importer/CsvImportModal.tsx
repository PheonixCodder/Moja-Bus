"use client";

import { Badge } from "@moja/ui/components/ui/badge";
import { Button } from "@moja/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";
import { Spinner } from "@moja/ui/components/ui/spinner";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  RotateCcw,
  Upload,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { autoDetectColumnMapping } from "@/lib/csv/fuzzy-matcher";
import { parseCsv } from "@/lib/csv/parser";
import { downloadCsvFile, generateSampleCsv } from "@/lib/csv/templates";
import type {
  ColumnMapping,
  CsvTemplateConfig,
  ImportSummary,
  ParsedCsvData,
} from "@/lib/csv/types";
import { ColumnMapper } from "./ColumnMapper";
import { ValidationPreview } from "./ValidationPreview";

export type ImportStep =
  | "upload"
  | "map"
  | "preview"
  | "submitting"
  | "complete";

interface CsvImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: CsvTemplateConfig;
  onImport: (params: {
    records: Record<string, unknown>[];
    upsert: boolean;
  }) => Promise<ImportSummary>;
  onSuccess?: () => void;
}

export function CsvImportModal({
  open,
  onOpenChange,
  config,
  onImport,
  onSuccess,
}: CsvImportModalProps) {
  const [step, setStep] = useState<ImportStep>("upload");
  const [_file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCsvData | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [upsert, setUpsert] = useState(false);
  const [skipInvalid, setSkipInvalid] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(
    null,
  );

  // Reset state when closing or resetting
  const handleReset = useCallback(() => {
    setStep("upload");
    setFile(null);
    setParsedData(null);
    setMapping({});
    setUpsert(false);
    setSkipInvalid(true);
    setIsSubmitting(false);
    setImportSummary(null);
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      handleReset();
    }
    onOpenChange(nextOpen);
  };

  // Process file upload
  const processFile = useCallback(
    (selectedFile: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (!text) {
          toast.error("The selected file is empty");
          return;
        }

        try {
          const parsed = parseCsv(text);
          if (parsed.headers.length === 0 || parsed.records.length === 0) {
            toast.error("No valid headers or data rows found in the CSV file");
            return;
          }

          const detectedMapping = autoDetectColumnMapping(
            parsed.headers,
            config.columns,
          );

          setFile(selectedFile);
          setParsedData(parsed);
          setMapping(detectedMapping);
          setStep("map");
          toast.success(
            `Loaded ${parsed.records.length} rows from ${selectedFile.name}`,
          );
        } catch {
          toast.error(
            "Failed to parse CSV file. Please check the file formatting.",
          );
        }
      };

      reader.readAsText(selectedFile);
    },
    [config.columns],
  );

  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processFile(selected);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      processFile(dropped);
    }
  };

  const handleDownloadSample = () => {
    const csvContent = generateSampleCsv(config);
    downloadCsvFile(config.filename, csvContent);
    toast.success(`Downloaded ${config.filename}`);
  };

  // Validation logic before moving to preview
  const handleProceedToPreview = () => {
    // Verify that all required target columns are mapped
    const mappedTargetKeys = new Set(Object.values(mapping).filter(Boolean));
    const missingRequired = config.columns.filter(
      (c) => c.required && !mappedTargetKeys.has(c.key),
    );

    if (missingRequired.length > 0) {
      toast.error(
        `Please map all required fields: ${missingRequired.map((c) => c.label).join(", ")}`,
      );
      return;
    }

    setStep("preview");
  };

  // Final commit
  const handleExecuteImport = async () => {
    if (!parsedData) return;

    // Apply mapping
    const targetToSource: Record<string, string> = {};
    for (const [src, tgt] of Object.entries(mapping)) {
      if (tgt) targetToSource[tgt] = src;
    }

    const preparedRecords: Record<string, unknown>[] = [];
    const invalidIndices = new Set<number>();

    parsedData.records.forEach((rawRecord, index) => {
      const mappedRecord: Record<string, unknown> = {};
      let hasError = false;

      for (const col of config.columns) {
        const srcHeader = targetToSource[col.key];
        const rawVal = srcHeader ? (rawRecord[srcHeader] ?? "").trim() : "";

        if (col.required && !rawVal) {
          hasError = true;
          break;
        }

        if (!rawVal) {
          mappedRecord[col.key] = null;
          continue;
        }

        if (col.type === "number") {
          const num = Number(rawVal.replace(/[,\s]/g, ""));
          if (Number.isNaN(num)) {
            hasError = true;
            break;
          }
          mappedRecord[col.key] = num;
        } else if (col.type === "boolean") {
          const lower = rawVal.toLowerCase();
          mappedRecord[col.key] = ["true", "1", "yes", "oui", "vrai"].includes(
            lower,
          );
        } else {
          mappedRecord[col.key] = rawVal;
        }
      }

      if (hasError) {
        invalidIndices.add(index);
      } else {
        preparedRecords.push(mappedRecord);
      }
    });

    if (preparedRecords.length === 0) {
      toast.error("No valid records to import.");
      return;
    }

    setIsSubmitting(true);
    setStep("submitting");

    try {
      const summary = await onImport({
        records: preparedRecords,
        upsert,
      });

      setImportSummary({
        totalRows: summary.totalRows ?? parsedData.records.length,
        validRows: summary.validRows ?? preparedRecords.length,
        invalidRows: summary.invalidRows ?? invalidIndices.size,
        createdCount: summary.createdCount,
        updatedCount: summary.updatedCount,
        skippedCount: summary.skippedCount,
        errors: summary.errors,
      });

      setStep("complete");
      onSuccess?.();
      toast.success(
        `Import completed: ${summary.createdCount ?? preparedRecords.length} created${
          summary.updatedCount ? `, ${summary.updatedCount} updated` : ""
        }`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Import failed";
      toast.error(msg);
      setStep("preview");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-6">
        <DialogHeader>
          <div className="flex items-center justify-between pr-4">
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Import {config.entityName}s from CSV
            </DialogTitle>
            <Badge variant="outline" className="text-xs capitalize font-mono">
              Step: {step}
            </Badge>
          </div>
          <DialogDescription className="text-xs">
            Bulk upload or update {config.entityName.toLowerCase()}s using a CSV
            or TSV spreadsheet.
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="space-y-4 py-3">
            {/* Download template card */}
            <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="space-y-1">
                <div className="font-semibold text-sm">
                  Need the spreadsheet template?
                </div>
                <p className="text-xs text-muted-foreground">
                  Download our pre-formatted sample CSV with all required column
                  headings and example values.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadSample}
                className="shrink-0 gap-1.5"
              >
                <Download className="h-4 w-4" />
                Download Sample CSV
              </Button>
            </div>

            {/* Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  fileInputRef.current?.click();
                }
              }}
              tabIndex={0}
              role="button"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                isDragActive
                  ? "border-primary bg-primary/10"
                  : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/20"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="rounded-full bg-muted p-3">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="text-sm font-medium">
                  {isDragActive
                    ? "Drop your file here..."
                    : "Click to select or drag and drop your CSV file"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Supports .csv, .tsv, and UTF-8 encoded text files
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Map Columns */}
        {step === "map" && parsedData && (
          <div className="py-2">
            <ColumnMapper
              parsedData={parsedData}
              targetColumns={config.columns}
              mapping={mapping}
              onMappingChange={setMapping}
            />
          </div>
        )}

        {/* Step 3: Preview */}
        {step === "preview" && parsedData && (
          <div className="py-2">
            <ValidationPreview
              parsedData={parsedData}
              targetColumns={config.columns}
              mapping={mapping}
              upsert={upsert}
              onUpsertChange={setUpsert}
              skipInvalid={skipInvalid}
              onSkipInvalidChange={setSkipInvalid}
            />
          </div>
        )}

        {/* Step 4: Submitting */}
        {step === "submitting" && (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <Spinner className="h-8 w-8 text-primary" />
            <div className="text-sm font-medium">
              Importing {config.entityName}s...
            </div>
            <div className="text-xs text-muted-foreground">
              Validating and writing records to the database. Please do not
              close this window.
            </div>
          </div>
        )}

        {/* Step 5: Complete */}
        {step === "complete" && importSummary && (
          <div className="py-6 space-y-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="text-lg font-bold">
                Import Completed Successfully
              </div>
              <p className="text-xs text-muted-foreground">
                Your spreadsheet data has been processed and saved.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-lg border bg-muted/20 p-4 text-center">
              <div>
                <div className="text-xs text-muted-foreground">Created</div>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {importSummary.createdCount ?? importSummary.validRows}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  Updated (Upsert)
                </div>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {importSummary.updatedCount ?? 0}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Skipped</div>
                <div className="text-xl font-bold text-muted-foreground">
                  {importSummary.skippedCount ?? importSummary.invalidRows}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dialog Footer Actions */}
        <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t">
          {step === "upload" && (
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
          )}

          {step === "map" && (
            <div className="flex w-full items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep("upload")}
                className="gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                size="sm"
                onClick={handleProceedToPreview}
                className="gap-1.5"
              >
                Preview Data
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === "preview" && (
            <div className="flex w-full items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep("map")}
                className="gap-1.5"
                disabled={isSubmitting}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Mapping
              </Button>
              <Button
                size="sm"
                onClick={handleExecuteImport}
                disabled={isSubmitting}
                className="gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    Importing...
                  </>
                ) : (
                  <>
                    Confirm & Import
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}

          {step === "complete" && (
            <div className="flex w-full items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="gap-1.5"
              >
                <RotateCcw className="h-4 w-4" />
                Import Another File
              </Button>
              <Button size="sm" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
