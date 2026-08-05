"use client";

import { useQueryState, parseAsInteger } from "nuqs";
import { Button } from "@moja/ui/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

interface RedirectsPaginationProps {
  totalItems: number;
  limit: number;
}

export function RedirectsPagination({ totalItems, limit }: RedirectsPaginationProps) {
  const t = useTranslations("adminDashboard.redirectsPagination");
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const totalPages = Math.ceil(totalItems / limit) || 1;

  const handlePrev = () => setPage(Math.max(1, page - 1));
  const handleNext = () => setPage(Math.min(totalPages, page + 1));

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        {t("showing", { start: (page - 1) * limit + 1, end: Math.min(page * limit, totalItems), total: totalItems })}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrev}
          disabled={page <= 1}
          className="h-8 w-8 p-0"
        >
          <span className="sr-only">{t("prevPage")}</span>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-medium px-2">
          {t("page", { page, totalPages })}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={page >= totalPages}
          className="h-8 w-8 p-0"
        >
          <span className="sr-only">{t("nextPage")}</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
