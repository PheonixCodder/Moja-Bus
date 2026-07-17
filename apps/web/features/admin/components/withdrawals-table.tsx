"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";
import { useTRPC } from "@/trpc/client";
import { withdrawalsSearchParams } from "../lib/search-params";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@moja/ui/components/ui/table";
import { createWithdrawalsColumns, type WithdrawalRow } from "./withdrawals-columns";

interface WithdrawalsTableProps {
  onResolve: (row: WithdrawalRow) => void;
  pageSize: number;
}

export function WithdrawalsTable({ onResolve, pageSize }: WithdrawalsTableProps) {
  const trpc = useTRPC();
  const [{ status, from, to, page }] = useQueryStates(
    withdrawalsSearchParams,
    { shallow: false }
  );

  const { data } = useSuspenseQuery(
    trpc.admin.listAllWithdrawals.queryOptions({
      limit: pageSize,
      offset: (page - 1) * pageSize,
      status: status === "ALL" ? undefined : status,
      from: from || undefined,
      to: to || undefined,
    })
  );

  const columns = createWithdrawalsColumns(onResolve);

  const table = useReactTable({
    data: data.items as WithdrawalRow[],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-xl border border-border bg-bg-base overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-b-border/60">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="h-10 text-xs font-medium text-text-muted">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-b-border/40 hover:bg-bg-muted/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-text-muted"
                >
                  No withdrawals found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
