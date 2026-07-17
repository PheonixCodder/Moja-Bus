"use client";

import { useQueryState, parseAsInteger } from "nuqs";
import { Button } from "@moja/ui/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface RedirectsPaginationProps {
  totalItems: number;
  limit: number;
}

export function RedirectsPagination({ totalItems, limit }: RedirectsPaginationProps) {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const totalPages = Math.ceil(totalItems / limit) || 1;

  const handlePrev = () => setPage(Math.max(1, page - 1));
  const handleNext = () => setPage(Math.min(totalPages, page + 1));

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{(page - 1) * limit + 1}</span> to{" "}
        <span className="font-medium text-foreground">
          {Math.min(page * limit, totalItems)}
        </span>{" "}
        of <span className="font-medium text-foreground">{totalItems}</span> results
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrev}
          disabled={page <= 1}
          className="h-8 w-8 p-0"
        >
          <span className="sr-only">Go to previous page</span>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-medium px-2">
          Page {page} of {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={page >= totalPages}
          className="h-8 w-8 p-0"
        >
          <span className="sr-only">Go to next page</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
