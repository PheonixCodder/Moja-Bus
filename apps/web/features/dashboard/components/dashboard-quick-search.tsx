"use client";

import { HeroSearchBar } from "@/features/home/components/hero-search-bar-2";

export function DashboardQuickSearch() {
  return (
    <div className="bg-card/60 backdrop-blur-md rounded-xl border border-border/60 shadow-xs mt-4 overflow-visible">
      <HeroSearchBar showTrustBar={false} />
    </div>
  );
}
