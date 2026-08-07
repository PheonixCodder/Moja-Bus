"use client";

import { Button } from "@moja/ui/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryStates } from "nuqs";
import { withdrawalsSearchParams } from "../lib/search-params";

interface WithdrawalsPaginationProps {
  total: number;
  pageSize: number;
}

export function WithdrawalsPagination({
  total,
  pageSize,
}: WithdrawalsPaginationProps) {
  const t = useTranslations("adminDashboard.withdrawalsPagination");
  const [{ page }, setParams] = useQueryStates(withdrawalsSearchParams, {
    shallow: false,
  });

  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-2">
      <span className="text-sm text-text-muted">
        {t("showing", {
          start: Math.min((page - 1) * pageSize + 1, total),
          end: Math.min(page * pageSize, total),
          total,
        })}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setParams({ page: Math.max(1, page - 1) })}
          disabled={page === 1}
        >
          <ChevronLeft className="size-4 mr-1" />
          {t("previous")}
        </Button>
        <span className="text-sm font-medium mx-2">
          {t("page", { current: page, total: totalPages })}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setParams({ page: Math.min(totalPages, page + 1) })}
          disabled={page === totalPages}
        >
          {t("next")}
          <ChevronRight className="size-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
