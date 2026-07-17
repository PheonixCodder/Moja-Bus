"use client";
"use no memo";

import * as React from "react";
import { format } from "date-fns";
import { MoreHorizontal, Mail, Phone } from "lucide-react";
import type { Table as TableType } from "@tanstack/react-table";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@moja/ui/components/ui/avatar";
import { Card, CardContent, CardFooter } from "@moja/ui/components/ui/card";
import { Button } from "@moja/ui/components/ui/button";
import { Badge } from "@moja/ui/components/ui/badge";
import { cn } from "@moja/ui/lib/utils";
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
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@moja/ui/components/ui/select";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { type TravelerRow, statusMeta, getAvatarTone, getInitials } from "./travelers-columns";

function getPageNumbers(currentPage: number, pageCount: number) {
  if (pageCount <= 3) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  if (currentPage <= 2) return [1, 2, 3];
  if (currentPage >= pageCount - 1) return [pageCount - 2, pageCount - 1, pageCount];
  return [currentPage - 1, currentPage, currentPage + 1];
}

export function TravelersGrid({ table }: { table: TableType<TravelerRow> }) {
  const pageCount = Math.max(table.getPageCount(), 1);
  const currentPage = Math.min(table.getState().pagination.pageIndex + 1, pageCount);
  const pageNumbers = getPageNumbers(currentPage, pageCount);
  const rowsPerPage = `${table.getState().pagination.pageSize}`;

  const rows = table.getRowModel().rows;
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  
  const updateRoleMutation = useMutation({
    ...trpc.admin.updateUserRole.mutationOptions(),
    onSuccess: () => {
      toast.success("User promoted to operator successfully.");
      queryClient.invalidateQueries(trpc.admin.listUsers.pathFilter());
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update role");
    },
  });

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pb-4">
      {rows.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {rows.map((row) => {
            const traveler = row.original;
            const meta = statusMeta[traveler.status];
            return (
              <Card key={traveler.id} className="flex flex-col overflow-hidden transition-all hover:shadow-md border-border/60">
                <CardContent className="p-5 flex-1 flex flex-col items-center text-center gap-3">
                  <div className="flex w-full justify-end mb-[-1rem]">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" className="size-8 text-muted-foreground hover:bg-muted/50 rounded-md">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toast.info("View Profile coming soon!")}>View profile</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info("Edit User coming soon!")}>Edit user</DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => updateRoleMutation.mutate({ userId: traveler.id, role: "OPERATOR" })}
                          disabled={updateRoleMutation.isPending}
                        >
                          Promote to Operator
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => toast.error("Deactivation endpoint coming soon!")}>
                          Deactivate user
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Avatar className="size-16 font-medium ring-2 ring-background mt-2">
                    <AvatarFallback className={cn("text-lg", getAvatarTone(traveler.name))}>
                      {getInitials(traveler.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h3 className="font-semibold leading-none tracking-tight">{traveler.name}</h3>
                    <p className="text-xs text-muted-foreground">Joined {traveler.joinedDate}</p>
                  </div>
                  <Badge className={cn("gap-1 border px-2 py-0.5 font-medium mt-1 mx-auto", meta.badgeClass)} variant="outline">
                    <span className={cn("size-1.5 rounded-full", meta.dotClass)} />
                    {traveler.status}
                  </Badge>
                  <div className="flex flex-col gap-1.5 mt-2 text-xs text-muted-foreground w-full items-center bg-slate-50/50 p-2.5 rounded-md border border-border/50">
                    <div className="flex items-center gap-1.5 truncate w-full justify-center">
                      <Mail className="size-3 shrink-0 opacity-70" />
                      <span className="truncate">{traveler.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate w-full justify-center">
                      <Phone className="size-3 shrink-0 opacity-70" />
                      <span className="truncate">{traveler.phone}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground bg-slate-50/30 rounded-lg border border-dashed border-border/60">
          <p>No travelers found.</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-border/60">
        <div className="flex items-center gap-4 text-muted-foreground text-sm">
          <div className="flex items-center gap-2">
            <span>Items per page</span>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger size="sm" className="w-20" id="travelers-grid-rows-per-page">
                <SelectValue placeholder={rowsPerPage} />
              </SelectTrigger>
              <SelectContent side="top">
                <SelectGroup>
                  {[12, 24, 36, 48].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <span>
            Page {currentPage} of {pageCount}
          </span>
        </div>

        <Pagination className="mx-0 w-auto justify-start md:justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
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
                    event.preventDefault();
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
                text=""
                className={!table.getCanNextPage() ? "pointer-events-none opacity-50" : undefined}
                onClick={(event) => {
                  event?.preventDefault();
                  table.nextPage();
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
