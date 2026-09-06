"use client";

import { Badge } from "@moja/ui/components/ui/badge";
import { Button } from "@moja/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@moja/ui/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@moja/ui/components/ui/table";
import { useSuspenseQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { RedirectDeleteDialog } from "./redirect-delete-dialog";
import { RedirectFormDialog } from "./redirect-form-dialog";
import { RedirectsPagination } from "./redirects-pagination";

type Redirect = {
  id: string;
  source: string;
  destination: string;
  type: number;
  createdAt: Date;
};

export function RedirectsTable() {
  const t = useTranslations("adminDashboard.redirectsTable");
  const trpc = useTRPC();
  const [q] = useQueryState("q", parseAsString.withDefault(""));
  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const limit = 20;

  const { data } = useSuspenseQuery(
    trpc.admin.listBlogRedirects.queryOptions(
      { search: q || undefined, page, limit },
      { placeholderData: (prev) => prev }, // keepPreviousData
    ),
  );

  const [editingRedirect, setEditingRedirect] = useState<Redirect | null>(null);
  const [deletingRedirect, setDeletingRedirect] = useState<Redirect | null>(
    null,
  );

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent bg-muted/30">
            <TableHead className="w-1/3 pl-6">{t("source")}</TableHead>
            <TableHead className="w-1/3">{t("destination")}</TableHead>
            <TableHead className="w-24">{t("type")}</TableHead>
            <TableHead className="w-36">{t("created")}</TableHead>
            <TableHead className="w-16 text-right pr-6">
              {t("actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-24 text-center text-muted-foreground"
              >
                {t("noResults")}
              </TableCell>
            </TableRow>
          ) : (
            data.items.map((redirect) => (
              <TableRow
                key={redirect.id}
                className="group hover:bg-muted/30"
              >
                <TableCell className="pl-6">
                  <span className="font-mono text-sm text-foreground bg-muted px-1.5 py-0.5 rounded-md">
                    {redirect.source}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm text-foreground bg-muted px-1.5 py-0.5 rounded-md">
                    {redirect.destination}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={redirect.type === 301 ? "default" : "secondary"}
                    className="font-mono text-xs"
                  >
                    {redirect.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {format(new Date(redirect.createdAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right pr-6">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity"
                        />
                      }
                    >
                      <span className="sr-only">{t("openMenu")}</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setEditingRedirect(redirect)}
                      >
                        <Pencil className="mr-2 h-4 w-4 text-muted-foreground" />
                        {t("edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeletingRedirect(redirect)}
                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t("delete")}
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
