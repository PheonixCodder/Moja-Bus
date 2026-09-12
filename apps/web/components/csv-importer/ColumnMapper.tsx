"use client";

import { Badge } from "@moja/ui/components/ui/badge";
import {
  NativeSelect,
  NativeSelectOption,
} from "@moja/ui/components/ui/native-select";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import type React from "react";
import type {
  ColumnMapping,
  CsvColumnDefinition,
  ParsedCsvData,
} from "@/lib/csv/types";

interface ColumnMapperProps {
  parsedData: ParsedCsvData;
  targetColumns: CsvColumnDefinition[];
  mapping: ColumnMapping;
  onMappingChange: (mapping: ColumnMapping) => void;
}

export function ColumnMapper({
  parsedData,
  targetColumns,
  mapping,
  onMappingChange,
}: ColumnMapperProps) {
  const sampleRow = parsedData.records[0] || {};

  const handleSelectChange = (sourceHeader: string, targetKey: string) => {
    onMappingChange({
      ...mapping,
      [sourceHeader]: targetKey,
    });
  };

  // Check required fields coverage
  const mappedTargetKeys = new Set(Object.values(mapping).filter(Boolean));
  const requiredCols = targetColumns.filter((col) => col.required);
  const mappedRequiredCount = requiredCols.filter((col) =>
    mappedTargetKeys.has(col.key),
  ).length;

  return (
    <div className="space-y-4">
      {/* Header status */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2
            className={`h-4 w-4 ${
              mappedRequiredCount === requiredCols.length
                ? "text-emerald-600"
                : "text-amber-500"
            }`}
          />
          <span className="font-medium">
            {mappedRequiredCount} of {requiredCols.length} required fields
            mapped
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {parsedData.headers.length} columns detected in CSV
        </span>
      </div>

      {/* Mapping list */}
      <div className="divide-y rounded-lg border">
        <div className="grid grid-cols-12 gap-2 bg-muted/50 p-2.5 text-xs font-semibold text-muted-foreground">
          <div className="col-span-5">CSV Column (Your File)</div>
          <div className="col-span-1 text-center" />
          <div className="col-span-6">Destination Field (Moja-Bus)</div>
        </div>

        <div className="max-h-[360px] divide-y overflow-y-auto">
          {parsedData.headers.map((sourceHeader) => {
            const currentTargetKey = mapping[sourceHeader] || "";
            const currentTarget = targetColumns.find(
              (c) => c.key === currentTargetKey,
            );
            const sampleVal = sampleRow[sourceHeader];

            return (
              <div
                key={sourceHeader}
                className="grid grid-cols-12 items-center gap-2 p-2.5 hover:bg-muted/20 text-sm"
              >
                {/* Source column */}
                <div className="col-span-5 min-w-0">
                  <div className="font-medium truncate text-foreground">
                    {sourceHeader}
                  </div>
                  {sampleVal ? (
                    <div className="truncate text-xs text-muted-foreground">
                      e.g. &ldquo;{sampleVal}&rdquo;
                    </div>
                  ) : (
                    <div className="text-xs italic text-muted-foreground">
                      (empty in first row)
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div className="col-span-1 flex justify-center text-muted-foreground">
                  <ArrowRight className="h-4 w-4" />
                </div>

                {/* Target dropdown */}
                <div className="col-span-6 flex items-center gap-2">
                  <NativeSelect
                    value={currentTargetKey}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      handleSelectChange(sourceHeader, e.target.value)
                    }
                    className="w-full text-xs"
                  >
                    <NativeSelectOption value="">
                      -- Do not import --
                    </NativeSelectOption>
                    {targetColumns.map((target) => (
                      <NativeSelectOption key={target.key} value={target.key}>
                        {target.label} {target.required ? "*" : "(optional)"}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>

                  {currentTarget?.required && (
                    <Badge
                      variant="outline"
                      className="shrink-0 border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px]"
                    >
                      Required
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
