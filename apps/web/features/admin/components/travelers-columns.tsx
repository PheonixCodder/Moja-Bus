"use client";
"use no memo";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@moja/ui/components/ui/avatar";
import { UserAvatar } from "@moja/ui/components/ui/user-avatar";
import { Badge } from "@moja/ui/components/ui/badge";
import { Button } from "@moja/ui/components/ui/button";
import { Checkbox } from "@moja/ui/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@moja/ui/components/ui/dropdown-menu";
import { cn } from "@moja/ui/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import type { useTranslations } from "next-intl";
import { toast } from "sonner";

export function getInitials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0]?.charAt(0).toUpperCase() || "U";
  return (
    (
      (parts[0]?.charAt(0) || "") + (parts[parts.length - 1]?.charAt(0) || "")
    ).toUpperCase() || "U"
  );
}

import { TravelerActionCell } from "./travelers-action-cell";
import { TravelerStatusBadge } from "./travelers-status-badge";

export type TravelerStatus = "Verified" | "Unverified";

export type TravelerRow = {
  id: string;
  image?: string | null;
  email: string;
  joinedDate: string;
  rawDate: number;
  name: string;
  phone: string;
  status: TravelerStatus;
};

export const statusMeta: Record<
  TravelerStatus,
  { badgeClass: string; dotClass: string }
> = {
  Verified: {
    badgeClass: "border-success/20 bg-success/10 text-success",
    dotClass: "bg-success",
  },
  Unverified: {
    badgeClass: "border-warning/20 bg-warning/10 text-warning",
    dotClass: "bg-warning",
  },
};

export function getAvatarTone(name: string) {
  const tones = [
    "bg-primary/10 text-primary",
    "bg-secondary text-secondary-foreground",
    "bg-accent text-accent-foreground",
    "bg-muted text-foreground",
  ];
  return tones[name.length % tones.length];
}

export function getTravelerColumns(
  t: ReturnType<typeof useTranslations>,
): ColumnDef<TravelerRow>[] {
  return [
    {
      id: "select",
      header: ({ table }: { table: any }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            aria-label={t("selectAllTravelers")}
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value: boolean | "indeterminate") =>
              table.toggleAllPageRowsSelected(!!value)
            }
          />
        </div>
      ),
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            aria-label={t("selectTraveler", { name: row.original.name })}
            checked={row.getIsSelected()}
            onCheckedChange={(value: boolean | "indeterminate") => row.toggleSelected(!!value)}
          />
        </div>
      ),
      enableHiding: false,
      enableSorting: false,
    },
    {
      id: "search",
      accessorFn: (row: TravelerRow) => `${row.name} ${row.email} ${row.phone}`,
      filterFn: "includesString",
      enableHiding: true,
    },
    {
      accessorKey: "name",
      header: t("traveler"),
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-3">
          <UserAvatar
            name={row.original.name}
            src={row.original.image}
            seed={row.original.id}
            size="md"
          />
          <div className="min-w-0">
            <div className="truncate font-medium text-foreground text-sm">
              {row.original.name}
            </div>
            <div className="truncate text-muted-foreground text-sm">
              {row.original.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: t("phone"),
      cell: ({ row }: { row: any }) => (
        <div className="text-sm">{row.original.phone}</div>
      ),
    },
    {
      accessorKey: "status",
      header: t("status"),
      filterFn: "equalsString",
      cell: ({ row }: { row: any }) => (
        <TravelerStatusBadge status={row.original.status} />
      ),
    },
    {
      id: "joinedDate",
      accessorFn: (row: TravelerRow) => row.rawDate,
      header: t("joinedDate"),
      cell: ({ row }: { row: any }) => (
        <div className="text-foreground text-sm">{row.original.joinedDate}</div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">{t("actions")}</div>,
      cell: ({ row }: { row: any }) => (
        <div className="text-right">
          <TravelerActionCell row={row.original} />
        </div>
      ),
      enableHiding: false,
      enableSorting: false,
    },
  ];
}
