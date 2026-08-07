"use client";

import { Card } from "@moja/ui/components/ui/card";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { BankAccessLogsFilters } from "../components/audit/bank-access/bank-access-logs-filters";
import { BankAccessLogsTable } from "../components/audit/bank-access/bank-access-logs-table";

export function AdminBankAccessLogsView() {
  const t = useTranslations("adminDashboard.adminBankAccessLogsView");
  return (
    <div className="space-y-6">
      <Card className="p-4 bg-muted/30 border-dashed">
        <BankAccessLogsFilters />
      </Card>

      <Card className="overflow-hidden shadow-sm border-border">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center p-12 text-center h-[400px]">
              <Spinner className="h-8 w-8 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                {t("loadingLogs")}
              </p>
            </div>
          }
        >
          <BankAccessLogsTable />
        </Suspense>
      </Card>
    </div>
  );
}
