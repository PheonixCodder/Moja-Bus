"use client";

import { Badge } from "@moja/ui/components/ui/badge";
import { CarrierAvatar } from "@moja/ui/components/ui/carrier-avatar";
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
            onCheckedChange={(value: boolean | "indeterminate") =>
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
            onCheckedChange={(value: boolean | "indeterminate") => row.toggleSelected(!!value)}
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
            <CarrierAvatar
              name={company.name}
              logoUrl={company.logoUrl}
              size="md"
              shape="rounded"
            />
            <div className="min-w-0">
              <Link
                href={`/dashboard/admin/verifications/${company.id}`}
                className="truncate font-semibold text-foreground text-sm hover:text-primary transition-colors cursor-pointer"
              >
                {company.name}
              </Link>
              <div className="truncate text-muted-foreground text-xs uppercase font-mono mt-0.5">
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
          return <span className="text-xs text-muted-foreground">{t("na")}</span>;

        return (
          <div className="grid gap-0.5 text-xs">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <User className="size-3 text-muted-foreground shrink-0" />
              {rep.fullName}
            </div>
            <div className="text-muted-foreground flex items-center gap-1.5 font-medium">
              <Mail className="size-3 text-muted-foreground shrink-0" />
              {rep.email}
            </div>
            {rep.phoneNumber && (
              <div className="text-muted-foreground flex items-center gap-1.5 font-medium">
                <Phone className="size-3 text-muted-foreground shrink-0" />
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
                  "flex items-center gap-0.5 rounded px-1.5 py-0.5 border text-xs font-bold tracking-tight select-none",
                  item.active
                    ? "bg-success/15 text-success border-success/30"
                    : "bg-muted text-muted-foreground border-border",
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
        let badgeClass = "bg-muted text-muted-foreground border-border";
        let dotClass = "bg-muted-foreground";

        if (status === "ACTIVE") {
          badgeClass = "bg-success/15 text-success border-success/30";
          dotClass = "bg-success";
        } else if (status === "PENDING_VERIFICATION") {
          badgeClass = "bg-warning/15 text-warning border-warning/30";
          dotClass = "bg-warning";
        } else if (status === "REJECTED" || status === "SUSPENDED") {
          badgeClass = "bg-destructive/15 text-destructive border-destructive/30";
          dotClass = "bg-destructive";
        } else if (status === "DRAFT") {
          badgeClass = "bg-primary/15 text-primary border-primary/30";
          dotClass = "bg-primary";
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
        return (
          <div className="text-muted-foreground text-xs font-semibold">
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
                className="bg-popover border border-border rounded shadow-md"
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
                      className="cursor-pointer text-xs text-destructive focus:bg-destructive/10 focus:text-destructive"
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
