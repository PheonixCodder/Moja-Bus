"use client";

import { Users, UserPlus } from "lucide-react";
import { Button } from "@moja/ui/components/ui/button";
import { useTranslations } from "next-intl";
import { PageHeaderAction } from "@/features/operator/components/header";

interface StaffPageHeaderProps {
  canInvite: boolean;
  onInvite: () => void;
}

export function StaffPageHeader({ canInvite, onInvite }: StaffPageHeaderProps) {
  const t = useTranslations("operatorDashboard.staff");
  return (
    <div className="border-b border-border bg-card px-6 py-5 shrink-0">
      <PageHeaderAction
        title={t("title")}
        description={t("headerDescription")}
        icon={Users}
        actions={
          canInvite ? (
            <Button
              size="sm"
              className="h-8.5 text-xs font-semibold"
              onClick={onInvite}
            >
              <UserPlus className="size-4 mr-1.5" />
              {t("invite")}
            </Button>
          ) : null
        }
      />
    </div>
  );
}
