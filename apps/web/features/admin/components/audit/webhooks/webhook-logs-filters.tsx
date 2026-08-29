"use client";

import { Input } from "@moja/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryStates } from "nuqs";
import { webhookLogsSearchParams } from "../../../lib/search-params";

export function WebhookLogsFilters() {
  const t = useTranslations("adminDashboard.webhookLogsFilters");
  const [params, setParams] = useQueryStates(webhookLogsSearchParams);

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between">
      <div className="relative w-full sm:w-96">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={t("searchPlaceholder")}
          className="w-full bg-background pl-8"
          value={params.search}
          onChange={(e) => setParams({ search: e.target.value || "", page: 1 })}
        />
      </div>
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
        <Select
          value={params.provider}
          onValueChange={(val: string | null) => setParams({ provider: val ?? "All", page: 1 })}
        >
          <SelectTrigger className="w-[140px] bg-background">
            <SelectValue placeholder={t("provider")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">{t("allProviders")}</SelectItem>
            <SelectItem value="Paystack">Paystack</SelectItem>
            <SelectItem value="Stripe">Stripe</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={params.status}
          onValueChange={(val: string | null) => setParams({ status: val ?? "All", page: 1 })}
        >
          <SelectTrigger className="w-[140px] bg-background">
            <SelectValue placeholder={t("allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">{t("allStatuses")}</SelectItem>
            <SelectItem value="Processed">{t("processed")}</SelectItem>
            <SelectItem value="Pending">{t("pending")}</SelectItem>
            <SelectItem value="Failed">{t("failed")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
