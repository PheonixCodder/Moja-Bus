import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { redirect } from "next/navigation";

import { SidebarInset, SidebarProvider } from "@moja/ui/components/ui/sidebar";
import { TooltipProvider } from "@moja/ui/components/ui/tooltip";
import { OperatorSidebar } from "@/features/operator/components/operator-sidebar";
import { getServerSession, getUser } from "@/lib/auth-server";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";
import { NotificationInbox } from "@/features/notifications/components/notification-inbox";

export default async function OperatorLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession();

  if (!session?.session) {
    redirect("/operator/login");
  }

  const role = (session.user as any)?.role || "TRAVELER";

  if (role !== "OPERATOR" && role !== "ADMIN") {
    redirect("/dashboard");
  }

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  const fullUser = await getUser();

  // Prefetch settings for the sidebar
  await prefetch(trpc.operator.getSettings.queryOptions());

  return (
    <HydrateClient>
      <TooltipProvider>
        <SidebarProvider defaultOpen={defaultOpen} className="h-svh">
          <Suspense
            fallback={
              <div className="hidden w-[var(--sidebar-width)] shrink-0 border-r border-border bg-sidebar md:block" />
            }
          >
            <OperatorSidebar user={fullUser} />
          </Suspense>
          <SidebarInset className="min-h-0 min-w-0 bg-bg-base relative">
            <div className="absolute right-4 top-1.5 z-40">
              <NotificationInbox />
            </div>
            <main className="flex min-h-0 flex-1 flex-col">{children}</main>
            <Toaster />
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </HydrateClient>
  );
}
