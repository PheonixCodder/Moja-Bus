"use client";

import { useQueryState, parseAsInteger } from "nuqs";
import { Button } from "@moja/ui/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BankAccessLogsPaginationProps {
  totalCount: number;
  limit: number;
}

export function BankAccessLogsPagination({ totalCount, limit }: BankAccessLogsPaginationProps) {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(0));

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const currentPage = page; // 0-indexed
  const displayPage = currentPage + 1; // 1-indexed for display

  return (
    <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
      <span>
        Page {displayPage} of {totalPages}
        {totalCount > 0 && (
          <span className="ml-1 text-xs">({totalCount} total records)</span>
        )}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          disabled={currentPage === 0}
          onClick={() => setPage(Math.max(0, currentPage - 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          disabled={currentPage >= totalPages - 1}
          onClick={() => setPage(currentPage + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
