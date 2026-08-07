"use client";

import { Button } from "@moja/ui/components/ui/button";
import { UserPlus, Users } from "lucide-react";
import { useTranslations } from "next-intl";

interface AdminStaffPageHeaderProps {
  canInvite: boolean;
  onInvite: () => void;
}

export function AdminStaffPageHeader({
  canInvite,
  onInvite,
}: AdminStaffPageHeaderProps) {
  const t = useTranslations("adminDashboard.staff");
  return (
    <div className="border-b border-border bg-card px-6 py-5 shrink-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-display tracking-tight text-foreground flex items-center gap-2">
            <Users className="size-5.5 text-primary" />
            {t("title")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("headerDescription")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canInvite ? (
            <Button
              size="sm"
              className="h-8.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={onInvite}
            >
              <UserPlus className="size-4 mr-1.5" />
              {t("invite")}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
