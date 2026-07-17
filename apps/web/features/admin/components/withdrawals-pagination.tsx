"use client";

import { useQueryStates } from "nuqs";
import { withdrawalsSearchParams } from "../lib/search-params";
import { Button } from "@moja/ui/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface WithdrawalsPaginationProps {
  total: number;
  pageSize: number;
}

export function WithdrawalsPagination({ total, pageSize }: WithdrawalsPaginationProps) {
  const [{ page }, setParams] = useQueryStates(withdrawalsSearchParams, {
    shallow: false,
  });

  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-2">
      <span className="text-sm text-text-muted">
        Showing {Math.min((page - 1) * pageSize + 1, total)} to{" "}
        {Math.min(page * pageSize, total)} of {total} entries
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setParams({ page: Math.max(1, page - 1) })}
          disabled={page === 1}
        >
          <ChevronLeft className="size-4 mr-1" />
          Previous
        </Button>
        <span className="text-sm font-medium mx-2">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setParams({ page: Math.min(totalPages, page + 1) })}
          disabled={page === totalPages}
        >
          Next
          <ChevronRight className="size-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
