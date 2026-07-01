import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { SidebarTrigger } from "@moja/ui/components/ui/sidebar";
import { Separator } from "@moja/ui/components/ui/separator";
import { OperatorDashboardView } from "@/features/operator/views/operator-dashboard-view";

import { OperatorQuickActions } from "@/features/operator/components/operator-quick-actions";

const API_BASE_URL =
  process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";

async function getOnboardingStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/operator/onboarding`, {
      headers: {
        cookie: (await headers()).get("cookie") || "",
      },
      next: { revalidate: 0 },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export const metadata = {
  title: "Overview — Moja Ride Operator",
};

export default async function OperatorDashboardPage() {
  const data = await getOnboardingStatus();

  if (!data || data.onboardingStatus !== "COMPLETED") {
    redirect("/dashboard/operator/onboarding");
  }

  return (
    <>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-bg-base px-4">
        <SidebarTrigger className="text-text-muted hover:text-text-primary" />
        <Separator orientation="vertical" className="h-4 bg-border" />
        <nav className="flex items-center gap-1 text-xs text-text-muted">
          <span className="text-text-primary font-medium">Overview</span>
        </nav>
        <OperatorQuickActions />
      </header>
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <OperatorDashboardView />
      </div>
    </>
  );
}
