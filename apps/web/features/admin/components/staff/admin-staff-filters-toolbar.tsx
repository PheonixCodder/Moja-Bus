"use client";

import { Input } from "@moja/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  ADMIN_ROLE_LABELS,
  type AdminStaffRole,
} from "@/features/admin/lib/admin-staff";

interface AdminStaffFiltersToolbarProps {
  search: string;
  role: string;
  status: string;
  isFetching: boolean;
  onSearchChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

export function AdminStaffFiltersToolbar({
  search,
  role,
  status,
  isFetching,
  onSearchChange,
  onRoleChange,
  onStatusChange,
}: AdminStaffFiltersToolbarProps) {
  const t = useTranslations("adminDashboard.staff");
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border bg-card px-6 py-3.5 gap-3.5 shrink-0">
      <div className="relative max-w-sm flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        {isFetching ? (
          <Spinner className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        ) : null}
        <Input
          placeholder={t("filters.searchPlaceholder")}
          className="pl-9 pr-9 h-9 shadow-none text-xs bg-bg-base border-border"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-semibold">
            {t("filters.roleLabel")}
          </span>
          <Select
            value={role}
            onValueChange={(value: string | null) => {
              if (value) onRoleChange(value);
            }}
          >
            <SelectTrigger className="h-8.5 w-[130px] border-border bg-bg-base text-xs">
              <SelectValue placeholder={t("filters.roleAll")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">
                {t("filters.roleAll")}
              </SelectItem>
              {(Object.keys(ADMIN_ROLE_LABELS) as AdminStaffRole[]).map((r) => (
                <SelectItem key={r} value={r} className="text-xs">
                  {ADMIN_ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-semibold">
            {t("filters.statusLabel")}
          </span>
          <Select
            value={status}
            onValueChange={(value: string | null) => {
              if (value) onStatusChange(value);
            }}
          >
            <SelectTrigger className="h-8.5 w-[130px] border-border bg-bg-base text-xs">
              <SelectValue placeholder={t("filters.statusAll")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">
                {t("filters.statusAll")}
              </SelectItem>
              <SelectItem value="ACTIVE" className="text-xs">
                {t("table.statusActive")}
              </SelectItem>
              <SelectItem value="INACTIVE" className="text-xs">
                {t("table.statusInactive")}
              </SelectItem>
              <SelectItem value="SUSPENDED" className="text-xs">
                {t("table.statusSuspended")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
