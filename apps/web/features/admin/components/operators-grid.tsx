"use client";

import * as React from "react";
import { type Table as ReactTable } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal, ShieldOff, Building2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@moja/ui/components/ui/badge";
import { Button } from "@moja/ui/components/ui/button";
import { Card, CardContent } from "@moja/ui/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,

  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@moja/ui/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@moja/ui/components/ui/pagination";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { type OperatorRow, statusMeta, getAvatarTone, getInitials } from "./operators-columns";
import { cn } from "@moja/ui/lib/utils";
import { format } from "date-fns";

function getPageNumbers(currentPage: number, pageCount: number) {
  if (pageCount <= 3) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  if (currentPage <= 2) return [1, 2, 3];
  if (currentPage >= pageCount - 1) return [pageCount - 2, pageCount - 1, pageCount];
  return [currentPage - 1, currentPage, currentPage + 1];
}

interface OperatorsGridProps {
  table: ReactTable<OperatorRow>;
}

export function OperatorsGrid({ table }: OperatorsGridProps) {
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = Math.max(table.getPageCount(), 1);
  const pageNumbers = getPageNumbers(pageIndex + 1, pageCount);
  const rowsPerPage = `${table.getState().pagination.pageSize}`;

  const rows = table.getRowModel().rows;
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  
  const demoteMutation = useMutation({
    ...trpc.admin.updateUserRole.mutationOptions(),
    onSuccess: () => {
      toast.success("Operator demoted to Traveler.");
      queryClient.invalidateQueries(trpc.admin.listUsers.pathFilter());
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update role");
    },
  });

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rows.length > 0 ? (
          rows.map((row) => {
            const operator = row.original;
            const initials = getInitials(operator.fullName);
            const toneClass = getAvatarTone(operator.fullName);
            const meta = statusMeta[operator.status] || statusMeta["Active"];
            const StatusIcon = meta?.icon;
            
            return (
              <Card key={row.id} className="overflow-hidden hover:shadow-md transition-shadow duration-200 border-muted">
                <CardContent className="p-0">
                  <div className="flex justify-between items-start p-4">
                    <Badge variant="outline" className={cn("font-normal gap-1 px-2 py-0.5 border-0 text-[10px]", meta?.className)}>
                      {StatusIcon && <StatusIcon className="h-3 w-3" />}
                      {meta?.label}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex h-8 w-8 -mr-2 -mt-2 items-center justify-center rounded-md p-0 text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <p className="px-2 py-1 text-xs font-normal text-muted-foreground">Actions</p>
                        <DropdownMenuItem>View Profile</DropdownMenuItem>
                        {operator.companies.length > 0 && (
                          <DropdownMenuItem>Manage Company</DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => demoteMutation.mutate({ userId: operator.id, role: "TRAVELER" })}
                          className="text-amber-600 focus:text-amber-600"
                        >
                          <ShieldOff className="mr-2 h-4 w-4" />
                          Demote to Traveler
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="flex flex-col items-center px-4 pb-6">
                    <div className={cn("h-16 w-16 rounded-full flex items-center justify-center text-xl font-medium mb-3 shadow-sm", toneClass)}>
                      {initials}
                    </div>
                    <h3 className="font-semibold text-base text-center line-clamp-1">{operator.fullName}</h3>
                    <p className="text-sm text-muted-foreground text-center line-clamp-1 mb-4">{operator.email}</p>
                    
                    {operator.companies && operator.companies.length > 0 ? (
                      <div className="flex items-center gap-1.5 justify-center w-full bg-muted/50 rounded-md py-1.5 px-3">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs font-medium truncate">{operator.companies[0]}</span>
                        {operator.companies.length > 1 && (
                          <Badge variant="secondary" className="text-[9px] h-4 px-1 py-0 ml-1 shrink-0">
                            +{operator.companies.length - 1}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 justify-center w-full text-muted-foreground py-1.5">
                        <Building2 className="h-3.5 w-3.5 opacity-50 shrink-0" />
                        <span className="text-xs italic">Unassigned</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 divide-x border-t bg-muted/20">
                    <div className="p-3 text-center flex flex-col justify-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Phone</p>
                      <p className="text-xs font-medium truncate">{operator.phone}</p>
                    </div>
                    <div className="p-3 text-center flex flex-col justify-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Joined</p>
                      <p className="text-xs font-medium">{format(operator.joinedAt, "MMM d, yy")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center border rounded-lg border-dashed bg-muted/10">
            <h3 className="text-lg font-medium">No operators found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              Adjust your search or filters to see more results.
            </p>
          </div>
        )}
      </div>

      {rows.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-4">
          <div className="text-sm text-muted-foreground order-2 sm:order-1">
            Showing <span className="font-medium text-foreground">{rows.length}</span> of <span className="font-medium text-foreground">{table.getFilteredRowModel().rows.length}</span> operators
          </div>
          
          <Pagination className="w-auto mx-0 order-1 sm:order-2">
            <PaginationContent>
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
              {pageNumbers[0] !== undefined && pageNumbers[0] > 1 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
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
              {pageNumbers[pageNumbers.length - 1] !== undefined && pageNumbers[pageNumbers.length - 1]! < pageCount && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
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
      )}
    </div>
  );
}
