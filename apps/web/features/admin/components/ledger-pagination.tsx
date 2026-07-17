"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@moja/ui/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";

interface LedgerPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function LedgerPagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: LedgerPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex items-center justify-between border border-border bg-white rounded-md p-4 shadow-sm">
      <div className="text-xs text-slate-500 font-medium select-none">
        Showing <span className="font-semibold text-slate-700">{total === 0 ? 0 : (page - 1) * pageSize + 1}</span> to{" "}
        <span className="font-semibold text-slate-700">{Math.min(page * pageSize, total)}</span> of{" "}
        <span className="font-semibold text-slate-700">{total}</span> entries
      </div>

      <div className="flex items-center gap-6">
        {/* Page Limit selection */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Rows per page:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(val) => onPageSizeChange(parseInt(val || "10", 10))}
          >
            <SelectTrigger className="h-8 w-[70px] text-xs font-semibold bg-white border border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border border-border shadow-md rounded">
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <div className="text-xs font-semibold text-slate-700 min-w-[50px] text-center select-none">
            Page {page} / {totalPages}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
