import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { redirect } from "next/navigation";

import { SidebarInset, SidebarProvider } from "@moja/ui/components/ui/sidebar";
import { TooltipProvider } from "@moja/ui/components/ui/tooltip";
import { OperatorSidebar } from "@/features/operator/components/operator-sidebar";
import { getServerSession, getUser } from "@/lib/auth-server";
import type { CustomUser } from "@/lib/auth-client";

export default async function OperatorLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession();

  if (!session?.data?.session) {
    redirect("/operator/login");
  }

  const user = (session.data as unknown as { user: CustomUser }).user;
  const role = user?.role || "TRAVELER";

  if (role !== "OPERATOR" && role !== "ADMIN") {
    redirect("/dashboard");
  }

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  const fullUser = await getUser();

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultOpen} className="h-svh">
        <OperatorSidebar user={fullUser} />
        <SidebarInset className="min-h-0 min-w-0 bg-bg-base">
          <main className="flex min-h-0 flex-1 flex-col">{children}</main>
          <Toaster />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
