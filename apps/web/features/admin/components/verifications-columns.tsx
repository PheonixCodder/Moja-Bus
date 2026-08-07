"use client";

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
import {
  Activity,
  Building,
  Check,
  Clock,
  FileText,
  Landmark,
  Mail,
  MoreHorizontal,
  Phone,
  ShieldAlert,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import type { useTranslations } from "next-intl";
import { formatAdminDate } from "@/lib/format-date";

export interface CompanyRow {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  businessType: string;
  registrationNumber: string;
  taxId: string;
  status: string;
  yearEstablished: number | null;
  logoUrl?: string | null;
  description?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  documents: any[];
  bankAccounts: any[];
  verification: {
    ownerIdentityVerified: boolean;
    bankVerified: boolean;
    documentsVerified: boolean;
    permitVerified: boolean;
  } | null;
  operators: {
    user: {
      fullName: string;
      email: string;
      phoneNumber: string | null;
    };
  }[];
}

interface ColumnsConfig {
  onReview: (company: CompanyRow) => void;
  onApprove: (company: CompanyRow) => void;
  onReject: (company: CompanyRow) => void;
  isApproving: boolean;
  t: ReturnType<typeof useTranslations>;
}

export function getCompanyColumns({
  onReview,
  onApprove,
  onReject,
  t,
}: ColumnsConfig): ColumnDef<CompanyRow>[] {
  return [
    {
      id: "select",
      header: ({ table }: any) => (
        <div className="flex items-center justify-center">
          <Checkbox
            aria-label={t("selectAllCompanies")}
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
          />
        </div>
      ),
      cell: ({ row }: any) => (
        <div className="flex items-center justify-center">
          <Checkbox
            aria-label={`${t("selectRow", { name: row.original.name })}`}
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
          />
        </div>
      ),
      enableHiding: false,
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: t("company"),
      cell: ({ row }: any) => {
        const company = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-500 font-medium select-none">
              {company.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <Link
                href={`/dashboard/admin/verifications/${company.id}`}
                className="truncate font-semibold text-slate-900 text-sm hover:text-primary transition-colors cursor-pointer"
              >
                {company.name}
              </Link>
              <div className="truncate text-slate-400 text-[10px] uppercase font-mono mt-0.5">
                Reg: {company.registrationNumber} • {t("tax")}: {company.taxId}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: "representative",
      header: t("representative"),
      cell: ({ row }: any) => {
        const rep = row.original.operators[0]?.user;
        if (!rep)
          return <span className="text-xs text-slate-400">{t("na")}</span>;
        return (
          <div className="grid gap-0.5 text-xs">
            <div className="font-semibold text-slate-700 flex items-center gap-1.5">
              <User className="size-3 text-slate-400 shrink-0" />
              {rep.fullName}
            </div>
            <div className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Mail className="size-3 text-slate-400 shrink-0" />
              {rep.email}
            </div>
            {rep.phoneNumber && (
              <div className="text-slate-400 flex items-center gap-1.5 font-medium">
                <Phone className="size-3 text-slate-400 shrink-0" />
                {rep.phoneNumber}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "kycProgress",
      header: t("kycChecklist"),
      cell: ({ row }: any) => {
        const check = row.original.verification;
        const items = [
          { label: t("id"), active: check?.ownerIdentityVerified, icon: User },
          { label: t("bank"), active: check?.bankVerified, icon: Landmark },
          {
            label: t("docs"),
            active: check?.documentsVerified,
            icon: FileText,
          },
          { label: t("permit"), active: check?.permitVerified, icon: Activity },
        ];

        return (
          <div className="flex items-center gap-1.5">
            {items.map((item) => (
              <div
                key={item.label}
                title={`${item.label}: ${item.active ? t("verified") : t("pending")}`}
                className={cn(
                  "flex items-center gap-0.5 rounded px-1.5 py-0.5 border text-[10px] font-bold tracking-tight select-none",
                  item.active
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-slate-50 text-slate-400 border-slate-200",
                )}
              >
                <item.icon className="size-3 shrink-0" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: t("status"),
      cell: ({ row }: any) => {
        const status = row.original.status;
        let badgeClass = "bg-slate-50 text-slate-700 border-slate-200";
        let dotClass = "bg-slate-400";

        if (status === "ACTIVE") {
          badgeClass = "bg-green-50 text-green-700 border-green-200";
          dotClass = "bg-green-600";
        } else if (status === "PENDING_VERIFICATION") {
          badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
          dotClass = "bg-amber-500";
        } else if (status === "REJECTED" || status === "SUSPENDED") {
          badgeClass = "bg-red-50 text-red-700 border-red-200";
          dotClass = "bg-red-600";
        } else if (status === "DRAFT") {
          badgeClass = "bg-sky-50 text-sky-700 border-sky-200";
          dotClass = "bg-sky-500";
        }

        return (
          <Badge
            className={cn(
              "gap-1.5 border px-2 py-1 font-semibold text-xs",
              badgeClass,
            )}
            variant="outline"
          >
            <span className={cn("size-1.5 rounded-full", dotClass)} />
            {t(`statusLabels.${status}`) ?? status.replace(/_/g, " ")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: t("submitted"),
      cell: ({ row }: any) => {
        const date = new Date(row.original.createdAt);
        return (
          <div className="text-slate-600 text-xs font-semibold">
            {formatAdminDate(row.original.createdAt)}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">{t("actions")}</div>,
      cell: ({ row }: any) => {
        const company = row.original;
        const hasBank = company.bankAccounts && company.bankAccounts.length > 0;

        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    aria-label={t("openActions", { name: company.name })}
                    className="size-8 rounded-md text-muted-foreground hover:bg-muted/50"
                    size="icon-sm"
                    variant="ghost"
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                }
              />
              <DropdownMenuContent
                align="end"
                className="bg-white border border-border rounded shadow-md"
              >
                <DropdownMenuItem
                  onClick={() => onReview(company)}
                  className="cursor-pointer text-xs"
                >
                  {t("reviewDocuments")}
                </DropdownMenuItem>
                {company.status === "PENDING_VERIFICATION" && (
                  <>
                    <DropdownMenuItem
                      disabled={!hasBank}
                      onClick={() => onApprove(company)}
                      className={cn(
                        "cursor-pointer text-xs",
                        !hasBank && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      {t("verifyApprove")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onReject(company)}
                      className="cursor-pointer text-xs text-red-600 focus:bg-red-50 focus:text-red-700"
                    >
                      {t("rejectRequest")}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      enableHiding: false,
      enableSorting: false,
    },
  ];
}
