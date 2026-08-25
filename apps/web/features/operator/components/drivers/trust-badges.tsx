"use client";

import { Award, ShieldCheck, Medal } from "lucide-react";
import { useTranslations } from "next-intl";
import type { TrustBadge } from "@/lib/driver-scoring";
import { cn } from "@moja/ui/lib/utils";

const BADGE_META: Record<
  TrustBadge,
  { icon: typeof Award; labelKey: string; className: string }
> = {
  TOP_RATED: {
    icon: Award,
    labelKey: "trustBadges.topRated",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  SAFE_DRIVER: {
    icon: ShieldCheck,
    labelKey: "trustBadges.safeDriver",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  VETERAN: {
    icon: Medal,
    labelKey: "trustBadges.veteran",
    className: "bg-violet-50 text-violet-700 border-violet-200",
  },
};

export function TrustBadges({
  badges,
  size = "sm",
  className,
}: {
  badges: TrustBadge[];
  size?: "sm" | "xs";
  className?: string;
}) {
  const t = useTranslations("operatorDashboard.drivers");
  if (!badges?.length) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {badges.map((badge) => {
        const meta = BADGE_META[badge];
        const Icon = meta.icon;
        return (
          <span
            key={badge}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border font-semibold",
              size === "xs" ? "px-1.5 py-0 text-[9px]" : "px-2 py-0.5 text-[10px]",
              meta.className,
            )}
          >
            <Icon className={size === "xs" ? "size-2.5" : "size-3"} />
            {t(meta.labelKey)}
          </span>
        );
      })}
    </div>
  );
}
