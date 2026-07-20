"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { MoreHorizontal, ShieldOff, CheckCircle2, AlertCircle, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useQueryClient, useMutation } from "@tanstack/react-query";

import { Badge } from "@moja/ui/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@moja/ui/components/ui/avatar";

import { Checkbox } from "@moja/ui/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@moja/ui/components/ui/dropdown-menu";
import { cn } from "@moja/ui/lib/utils";
import { useTRPC } from "@/trpc/client";

export type OperatorRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  status: "Active" | "Pending";
  companies: string[];
  joinedAt: Date;
  avatar: string;
};

export const statusMeta: Record<string, { label: string; icon: any; className: string }> = {
  Active: {
    label: "Active",
    icon: CheckCircle2,
    className: "bg-emerald-100/50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 hover:bg-emerald-100/80",
  },
  Pending: {
    label: "Pending",
    icon: AlertCircle,
    className: "bg-amber-100/50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 hover:bg-amber-100/80",
  },
};

export function getAvatarTone(name: string) {
  const tones = [
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400",
    "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return tones[Math.abs(hash) % tones.length]!;
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Custom filter function for the "search" column filter
const searchFilter = (row: any, columnId: string, filterValue: string) => {
  const searchableText = `${row.original.fullName} ${row.original.email} ${row.original.phone}`.toLowerCase();
  return searchableText.includes(filterValue.toLowerCase());
};

export const columns: ColumnDef<OperatorRow>[] = [
  {
    id: "search",
    filterFn: searchFilter,
    enableHiding: true,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          aria-label="Select all operators"
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          aria-label="Select row"
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "fullName",
    header: "Operator",
    cell: ({ row }) => {
      const operator = row.original;
      const initials = getInitials(operator.fullName);
      const toneClass = getAvatarTone(operator.fullName);

      return (
        <div className="flex items-center gap-3">
          <Avatar className={cn("h-9 w-9 shrink-0 font-medium", toneClass)}>
            <AvatarImage src={operator.avatar || undefined} alt={operator.fullName} />
            <AvatarFallback className={cn("text-xs", toneClass)}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-sm text-foreground">{operator.fullName}</span>
            <span className="text-xs text-muted-foreground">{operator.email}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "companies",
    header: "Company",
    cell: ({ row }) => {
      const companies = row.original.companies;
      if (!companies || companies.length === 0) {
        return (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-3 w-3" />
            <span className="text-sm">Unassigned</span>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-foreground font-medium text-sm">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            {companies[0]}
          </div>
          {companies.length > 1 && (
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-medium rounded-sm">
              +{companies.length - 1} more
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "phone",
    header: "Phone Number",
    cell: ({ row }) => {
      const phone = row.getValue("phone") as string;
      return <span className="text-sm text-muted-foreground">{phone}</span>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    filterFn: (row, id, value) => value === row.getValue(id),
    cell: ({ row }) => {
      const status = row.getValue("status") as keyof typeof statusMeta;
      const meta = statusMeta[status];
      const Icon = meta?.icon;

      return (
        <Badge variant="outline" className={cn("font-normal gap-1.5 px-2.5 py-0.5 border-0", meta?.className)}>
          {Icon && <Icon className="h-3.5 w-3.5" />}
          {meta?.label || status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "joinedAt",
    header: "Joined",
    cell: ({ row }) => {
      return (
        <span className="text-sm text-muted-foreground">
          {format(row.getValue("joinedAt"), "MMM d, yyyy")}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: function ActionCell({ row }) {
      const operator = row.original;
      const trpc = useTRPC();
      const queryClient = useQueryClient();
      const router = useRouter();

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
        <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md p-0 text-muted-foreground hover:bg-muted focus:outline-none">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <p className="px-2 py-1 text-xs font-normal text-muted-foreground">Actions</p>
              <DropdownMenuItem onClick={() => router.push(`/dashboard/admin/users/operators/${operator.id}`)}>
                View Profile
              </DropdownMenuItem>
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
      );
    },
  },
];
