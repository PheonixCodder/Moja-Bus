"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useQueryState, parseAsString, parseAsInteger } from "nuqs";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@moja/ui/components/ui/table";
import { Badge } from "@moja/ui/components/ui/badge";
import { Button } from "@moja/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@moja/ui/components/ui/dropdown-menu";

import { RedirectsPagination } from "./redirects-pagination";
import { RedirectFormDialog } from "./redirect-form-dialog";
import { RedirectDeleteDialog } from "./redirect-delete-dialog";

type Redirect = {
  id: string;
  source: string;
  destination: string;
  type: number;
  createdAt: Date;
};

export function RedirectsTable() {
  const trpc = useTRPC();
  const [q] = useQueryState("q", parseAsString.withDefault(""));
  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const limit = 20;

  const { data } = useSuspenseQuery(
    trpc.admin.listBlogRedirects.queryOptions(
      { search: q || undefined, page, limit },
      { placeholderData: (prev) => prev } // keepPreviousData
    )
  );

  const [editingRedirect, setEditingRedirect] = useState<Redirect | null>(null);
  const [deletingRedirect, setDeletingRedirect] = useState<Redirect | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent bg-slate-50/50">
            <TableHead className="w-[35%] pl-6">Source</TableHead>
            <TableHead className="w-[35%]">Destination</TableHead>
            <TableHead className="w-[10%]">Type</TableHead>
            <TableHead className="w-[15%]">Created</TableHead>
            <TableHead className="w-[5%] text-right pr-6">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                No redirects found.
              </TableCell>
            </TableRow>
          ) : (
            data.items.map((redirect) => (
              <TableRow key={redirect.id} className="group hover:bg-slate-50/50">
                <TableCell className="pl-6">
                  <span className="font-mono text-sm text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-md">
                    {redirect.source}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-md">
                    {redirect.destination}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={redirect.type === 301 ? "default" : "secondary"} className="font-mono text-xs">
                    {redirect.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-500 text-sm">
                  {format(new Date(redirect.createdAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right pr-6">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingRedirect(redirect)}>
                        <Pencil className="mr-2 h-4 w-4 text-slate-500" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setDeletingRedirect(redirect)}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      {data.total > 0 && (
        <div className="border-t p-4">
          <RedirectsPagination totalItems={data.total} limit={limit} />
        </div>
      )}

      {/* Edit Dialog */}
      <RedirectFormDialog 
        open={!!editingRedirect} 
        onOpenChange={(isOpen) => !isOpen && setEditingRedirect(null)}
        redirect={editingRedirect}
      />

      {/* Delete Dialog */}
      <RedirectDeleteDialog
        open={!!deletingRedirect}
        onOpenChange={(isOpen) => !isOpen && setDeletingRedirect(null)}
        redirect={deletingRedirect}
      />
    </>
  );
}
