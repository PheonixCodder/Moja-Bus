"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@moja/ui/components/ui/avatar";
import { UserAvatar } from "@moja/ui/components/ui/user-avatar";
import { Badge } from "@moja/ui/components/ui/badge";
import { Checkbox } from "@moja/ui/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@moja/ui/components/ui/dropdown-menu";
import { cn } from "@moja/ui/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  MoreHorizontal,
  ShieldOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
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

export const statusMeta: Record<
  string,
  { label: string; icon: any; className: string }
> = {
  Active: {
    label: "Active",
    icon: CheckCircle2,
    className:
      "bg-success/10 text-success border-success/20 hover:bg-success/15",
  },
  Pending: {
    label: "Pending",
    icon: AlertCircle,
    className:
      "bg-warning/10 text-warning border-warning/20 hover:bg-warning/15",
  },
};

export function getAvatarTone(name: string) {
  const tones = [
    "bg-primary/10 text-primary",
    "bg-secondary text-secondary-foreground",
    "bg-accent text-accent-foreground",
    "bg-muted text-foreground",
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
  const searchableText =
    `${row.original.fullName} ${row.original.email} ${row.original.phone}`.toLowerCase();
  return searchableText.includes(filterValue.toLowerCase());
};

export function getOperatorColumns(t: any): ColumnDef<OperatorRow>[] {
  return [
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
            aria-label={t("selectAllOperators")}
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value: boolean | "indeterminate") =>
              table.toggleAllPageRowsSelected(!!value)
            }
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            aria-label={t("selectRow")}
            checked={row.getIsSelected()}
            onCheckedChange={(value: boolean | "indeterminate") => row.toggleSelected(!!value)}
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "fullName",
      header: t("operator"),
      cell: ({ row }) => {
        const operator = row.original;
        const initials = getInitials(operator.fullName);
        const toneClass = getAvatarTone(operator.fullName);

        return (
          <div className="flex items-center gap-3">
            <UserAvatar
              name={operator.fullName}
              src={operator.avatar}
              seed={operator.id}
              size="md"
              className="h-9 w-9 shrink-0 font-medium"
            />
            <div className="flex flex-col">
              <span className="font-medium text-sm text-foreground">
                {operator.fullName}
              </span>
              <span className="text-xs text-muted-foreground">
                {operator.email}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "companies",
      header: t("company"),
      cell: ({ row }) => {
        const companies = row.original.companies;
        if (!companies || companies.length === 0) {
          return (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-3 w-3" />
              <span className="text-sm">{t("unassigned")}</span>
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
              <Badge
                variant="secondary"
                className="text-[10px] h-5 px-1.5 font-medium rounded-sm"
              >
                +{companies.length - 1} {t("more")}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "phone",
      header: t("phoneNumber"),
      cell: ({ row }) => {
        const phone = row.getValue("phone") as string;
        return <span className="text-sm text-muted-foreground">{phone}</span>;
      },
    },
    {
      accessorKey: "status",
      header: t("status"),
      filterFn: (row, id, value) => value === row.getValue(id),
      cell: ({ row }) => {
        const status = row.getValue("status") as keyof typeof statusMeta;
        const meta = statusMeta[status];
        const Icon = meta?.icon;

        return (
          <Badge
            variant="outline"
            className={cn(
              "font-normal gap-1.5 px-2.5 py-0.5 border-0",
              meta?.className,
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {meta?.label || status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "joinedAt",
      header: t("joined"),
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
        const t = useTranslations("adminDashboard.operatorsActionCell");
        const operator = row.original;
        const trpc = useTRPC();
        const queryClient = useQueryClient();
        const router = useRouter();

        const demoteMutation = useMutation({
          ...trpc.admin.updateUserRole.mutationOptions(),
          onSuccess: () => {
            toast.success(t("demotedToTraveler"));
            queryClient.invalidateQueries(trpc.admin.listUsers.pathFilter());
          },
          onError: (err: any) => {
            toast.error(err.message || t("failedToUpdateRole"));
          },
        });

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md p-0 text-muted-foreground hover:bg-muted focus:outline-none">
                <span className="sr-only">{t("openMenu")}</span>
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <p className="px-2 py-1 text-xs font-normal text-muted-foreground">
                  {t("actions")}
                </p>
                <DropdownMenuItem
                  onClick={() =>
                    router.push(
                      `/dashboard/admin/users/operators/${operator.id}`,
                    )
                  }
                >
                  {t("viewProfile")}
                </DropdownMenuItem>
                {operator.companies.length > 0 && (
                  <DropdownMenuItem>{t("manageCompany")}</DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    demoteMutation.mutate({
                      userId: operator.id,
                      role: "TRAVELER",
                    })
                  }
                  className="text-warning focus:text-warning"
                >
                  <ShieldOff className="mr-2 h-4 w-4" />
                  {t("demoteToTraveler")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
