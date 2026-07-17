"use client";

import { flexRender, type Table as TableType } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@moja/ui/components/ui/table";
import { LedgerEntryRow } from "./ledger-columns";

interface LedgerTableProps {
  table: TableType<LedgerEntryRow>;
}

export function LedgerTable({ table }: LedgerTableProps) {
  return (
    <div className="rounded-md border border-border bg-white overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50 border-b border-border">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="h-10 text-xs font-bold text-slate-500 uppercase tracking-wider px-4"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="py-3 px-4 align-middle"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={ledgerColumnsLength(table)}
                className="h-32 text-center text-xs text-slate-400"
              >
                No ledger entries found matching active filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function ledgerColumnsLength(table: TableType<LedgerEntryRow>) {
  return table.getAllColumns().length;
}
