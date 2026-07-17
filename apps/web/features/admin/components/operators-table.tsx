"use client";

import * as React from "react";
import { type Table as ReactTable, flexRender } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@moja/ui/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@moja/ui/components/ui/pagination";
import { type OperatorRow } from "./operators-columns";

function getPageNumbers(currentPage: number, pageCount: number) {
  if (pageCount <= 3) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  if (currentPage <= 2) return [1, 2, 3];
  if (currentPage >= pageCount - 1) return [pageCount - 2, pageCount - 1, pageCount];
  return [currentPage - 1, currentPage, currentPage + 1];
}

interface OperatorsTableProps {
  table: ReactTable<OperatorRow>;
}

export function OperatorsTable({ table }: OperatorsTableProps) {
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = Math.max(table.getPageCount(), 1);
  const pageNumbers = getPageNumbers(pageIndex + 1, pageCount);

  return (
    <div className="flex flex-col h-full">
      <div className="border-y">
        <Table>
          <TableHeader className="bg-muted/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-b-muted">
                {headerGroup.headers.map((header) => {
                  if (header.column.id === "search") return null;
                  return (
                    <TableHead 
                      key={header.id} 
                      className="h-10 text-xs font-medium text-muted-foreground whitespace-nowrap"
                    >
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
                  className="group hover:bg-muted/30 data-[state=selected]:bg-primary/5 border-b-muted/50"
                >
                  {row.getVisibleCells().map((cell) => {
                    if (cell.column.id === "search") return null;
                    return (
                      <TableCell key={cell.id} className="py-3 px-4 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center text-sm">
                    <p>No operators found.</p>
                    <p className="text-xs opacity-70">Adjust your search or filters to see more results.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-4 py-4 mt-auto border-t">
        <div className="text-xs text-muted-foreground">
          Showing <span className="font-medium text-foreground">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span> to <span className="font-medium text-foreground">{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)}</span> of <span className="font-medium text-foreground">{table.getFilteredRowModel().rows.length}</span> operators
        </div>
        
        <Pagination className="w-auto mx-0">
          <PaginationContent className="gap-1">
            <PaginationItem className="hidden sm:inline-flex">
              <PaginationLink
                href="#"
                onClick={(event) => {
                  event?.preventDefault();
                  table.setPageIndex(0);
                }}
                className={`h-8 w-8 p-0 ${!table.getCanPreviousPage() ? "pointer-events-none opacity-50" : ""}`}
              >
                <ChevronsLeft className="h-4 w-4" />
                <span className="sr-only">First page</span>
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                size="sm"
                text=""
                className={!table.getCanPreviousPage() ? "pointer-events-none opacity-50" : undefined}
                onClick={(event) => {
                  event?.preventDefault();
                  table.previousPage();
                }}
              />
            </PaginationItem>
            {pageNumbers[0] !== undefined && pageNumbers[0] > 1 ? (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            ) : null}
            {pageNumbers.map((pageNumber) => (
              <PaginationItem key={`page-${pageNumber}`}>
                <PaginationLink
                  href="#"
                  isActive={table.getState().pagination.pageIndex === pageNumber - 1}
                  onClick={(event) => {
                    event?.preventDefault();
                    table.setPageIndex(pageNumber - 1);
                  }}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            ))}
            {pageNumbers[pageNumbers.length - 1] !== undefined && pageNumbers[pageNumbers.length - 1]! < pageCount ? (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            ) : null}
            <PaginationItem>
              <PaginationNext
                href="#"
                size="sm"
                text=""
                className={!table.getCanNextPage() ? "pointer-events-none opacity-50" : undefined}
                onClick={(event) => {
                  event?.preventDefault();
                  table.nextPage();
                }}
              />
            </PaginationItem>
            <PaginationItem className="hidden sm:inline-flex">
              <PaginationLink
                href="#"
                onClick={(event) => {
                  event?.preventDefault();
                  table.setPageIndex(table.getPageCount() - 1);
                }}
                className={`h-8 w-8 p-0 ${!table.getCanNextPage() ? "pointer-events-none opacity-50" : ""}`}
              >
                <ChevronsRight className="h-4 w-4" />
                <span className="sr-only">Last page</span>
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
