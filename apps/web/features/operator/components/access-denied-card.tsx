"use client";

import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@moja/ui/components/ui/button";

interface AccessDeniedCardProps {
  permission?: string;
  title?: string;
  description?: string;
}

export function AccessDeniedCard({
  permission,
  title,
  description,
}: AccessDeniedCardProps) {
  const t = useTranslations("operatorDashboard.accessDenied");
  const displayTitle = title || t("title");
  const displayDesc = description || t("description");

  return (
    <div className="container max-w-4xl py-16 px-4 flex flex-col items-center justify-center text-center space-y-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert className="h-8 w-8" />
      </div>

      <div className="space-y-2 max-w-md">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">{displayTitle}</h2>
        <p className="text-sm text-muted-foreground">{displayDesc}</p>
        {permission && (
          <p className="text-xs font-mono text-muted-foreground/70 pt-2">
            {t("requiredPermission")} <span className="text-destructive font-semibold">{permission}</span>
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button variant="outline" render={<Link href="/dashboard/operator" />}>
          {t("returnOverview")}
        </Button>
      </div>
    </div>
  );
}
