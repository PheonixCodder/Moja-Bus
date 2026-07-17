"use client";
"use no memo";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@moja/ui/components/ui/avatar";
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

export function getInitials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0]?.charAt(0).toUpperCase() || "U";
  return ((parts[0]?.charAt(0) || "") + (parts[parts.length - 1]?.charAt(0) || "")).toUpperCase() || "U";
}
import { TravelerActionCell } from "./travelers-action-cell";
import { TravelerStatusBadge } from "./travelers-status-badge";

export type TravelerStatus = "Verified" | "Unverified";

export type TravelerRow = {
  id: string;
  email: string;
  joinedDate: string;
  rawDate: number;
  name: string;
  phone: string;
  status: TravelerStatus;
};

export const statusMeta: Record<TravelerStatus, { badgeClass: string; dotClass: string }> = {
  Verified: {
    badgeClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dotClass: "bg-emerald-500",
  },
  Unverified: {
    badgeClass: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    dotClass: "bg-amber-500",
  },
};

export function getAvatarTone(name: string) {
  const tones = [
    "bg-amber-100 text-amber-700",
    "bg-orange-100 text-orange-700",
    "bg-rose-100 text-rose-700",
    "bg-pink-100 text-pink-700",
    "bg-fuchsia-100 text-fuchsia-700",
    "bg-purple-100 text-purple-700",
    "bg-violet-100 text-violet-700",
    "bg-indigo-100 text-indigo-700",
    "bg-sky-100 text-sky-700",
    "bg-emerald-100 text-emerald-700",
  ];
  return tones[name.length % tones.length];
}

export const travelersColumns: ColumnDef<TravelerRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          aria-label="Select all travelers"
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          aria-label={`Select ${row.original.name}`}
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      </div>
    ),
    enableHiding: false,
    enableSorting: false,
  },
  {
    id: "search",
    accessorFn: (row) => `${row.name} ${row.email} ${row.phone}`,
    filterFn: "includesString",
    enableHiding: true,
  },
  {
    accessorKey: "name",
    header: "Traveler",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Avatar className="size-10 font-medium">
          <AvatarFallback className={cn("text-xs", getAvatarTone(row.original.name))}>
            {getInitials(row.original.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground text-sm">{row.original.name}</div>
          <div className="truncate text-muted-foreground text-sm">{row.original.email}</div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => <div className="text-sm">{row.original.phone}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    filterFn: "equalsString",
    cell: ({ row }) => <TravelerStatusBadge status={row.original.status} />,
  },
  {
    id: "joinedDate",
    accessorFn: (row) => row.rawDate,
    header: "Joined date",
    cell: ({ row }) => <div className="text-foreground text-sm">{row.original.joinedDate}</div>,
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => (
      <div className="text-right">
        <TravelerActionCell row={row.original} />
      </div>
    ),
    enableHiding: false,
    enableSorting: false,
  },
];
