"use client";

import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryStates } from "nuqs";
import { bankAccessLogSearchParams } from "../../../lib/search-params";

export function BankAccessLogsFilters() {
  const t = useTranslations("adminDashboard.bankAccessLogsFilters");
  const [{ action, companyId, userId }, setFilters] = useQueryStates(
    bankAccessLogSearchParams,
  );

  const hasFilters = Boolean(action || companyId || userId);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={action || "__all__"}
        onValueChange={(v) => {
          setFilters({ action: v === "__all__" ? null : v, page: 0 });
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t("allActions")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{t("allActions")}</SelectItem>
          <SelectItem value="VIEW_FULL">{t("decryptionViewFull")}</SelectItem>
          <SelectItem value="CREATE">{t("creationCreate")}</SelectItem>
          <SelectItem value="UPDATE">{t("modificationUpdate")}</SelectItem>
        </SelectContent>
      </Select>

      <Input
        placeholder={t("filterByCompanyId")}
        value={companyId || ""}
        onChange={(e) =>
          setFilters({ companyId: e.target.value || null, page: 0 })
        }
        className="w-[200px]"
      />

      <Input
        placeholder={t("filterByUserId")}
        value={userId || ""}
        onChange={(e) =>
          setFilters({ userId: e.target.value || null, page: 0 })
        }
        className="w-[200px]"
      />

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            setFilters({ action: null, companyId: null, userId: null, page: 0 })
          }
          className="h-9 px-2.5 text-muted-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          {t("reset")}
        </Button>
      )}
    </div>
  );
}
