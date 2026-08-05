"use client";

import { Operators } from "../components/operators";
import { Plus } from "lucide-react";
import { Button } from "@moja/ui/components/ui/button";
import { useTranslations } from "next-intl";

export function AdminOperatorsView() {
  const t = useTranslations("adminDashboard.adminOperatorsView");
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> {t("addOperator")}
          </Button>
        </div>
      </div>
      <Operators />
    </div>
  );
}
