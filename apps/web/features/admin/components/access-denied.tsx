"use client";

import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface AccessDeniedProps {
  reason?: "admin-profile-missing" | "suspended";
}

export function AccessDenied({ reason }: AccessDeniedProps) {
  const t = useTranslations("adminDashboard.accessDenied");
  const isSuspended = reason === "suspended";

  return (
    <div className="flex min-h-svh items-center justify-center bg-bg-base px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {isSuspended ? t("accountSuspended") : t("adminUnavailable")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isSuspended ? t("suspendedDesc") : t("profileMissingDesc")}
          </p>
        </div>
        <a
          href="/dashboard"
          className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {t("returnToDashboard")}
        </a>
        <p className="text-xs text-muted-foreground">
          <Link href="/logout" className="underline underline-offset-4">
            {t("signOut")}
          </Link>
        </p>
      </div>
    </div>
  );
}
