"use client";

import { Button } from "@moja/ui/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("adminDashboard.ledgerPagination");
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex items-center justify-between border border-border bg-card rounded-md p-4 shadow-sm">
      <div className="text-xs text-muted-foreground font-medium select-none">
        {t("showing")}{" "}
        <span className="font-semibold text-foreground">
          {total === 0 ? 0 : (page - 1) * pageSize + 1}
        </span>{" "}
        {t("to")}{" "}
        <span className="font-semibold text-foreground">
          {Math.min(page * pageSize, total)}
        </span>{" "}
        {t("of")} <span className="font-semibold text-foreground">{total}</span>{" "}
        {t("entries")}
      </div>

      <div className="flex items-center gap-6">
        {/* Page Limit selection */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground font-medium">{t("rowsPerPage")}</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(val) => onPageSizeChange(parseInt(val || "10", 10))}
          >
            <SelectTrigger className="h-8 w-18 text-xs font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
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
            className="size-8"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <div className="text-xs font-semibold text-foreground min-w-12 text-center select-none">
            {t("page", { page, totalPages })}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
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
