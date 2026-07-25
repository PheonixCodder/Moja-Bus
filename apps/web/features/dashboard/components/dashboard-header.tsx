"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

import { authClient } from "@/lib/auth-client";
import type { User } from "@/lib/auth-client";

interface DashboardViewProps {
  user: User | null;
}

export function DashboardHeader({ user }: DashboardViewProps) {
  const t = useTranslations("passengerDashboard.overview");
  const locale = useLocale();
  const firstName = user?.name?.split(" ")[0] ?? null;

  return (
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <p className="text-sm text-text-muted">
          {new Date().toLocaleDateString(locale, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary lg:text-3xl">
          {t("greeting", { name: firstName ?? "Traveler" })}
        </h1>
      </div>

      <Link
        href="/"
        className="inline-flex items-center gap-1.5 rounded-md bg-neon px-3 py-1.5 text-sm font-semibold text-black shadow-[0_0_12px_rgba(57,255,20,0.15),0_0_2px_rgba(57,255,20,1)] transition-shadow duration-150 hover:bg-neon/90"
      >
        <Search className="size-4" />
        {t("findBus")}
      </Link>
    </div>
  );
}
