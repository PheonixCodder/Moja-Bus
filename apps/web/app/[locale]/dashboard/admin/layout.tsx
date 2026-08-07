import { getPrismaClient } from "@moja/db";
import { SidebarInset, SidebarProvider } from "@moja/ui/components/ui/sidebar";
import { TooltipProvider } from "@moja/ui/components/ui/tooltip";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { AccessDenied } from "@/features/admin/components/access-denied";
import { AdminSidebar } from "@/features/admin/components/admin-sidebar";
import { NotificationInbox } from "@/features/notifications/components/notification-inbox";
import { getServerSession, getUser } from "@/lib/auth-server";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession();

  if (!session?.session) {
    redirect("/login");
  }

  const role = (session.user as any)?.role || "TRAVELER";

  if (role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Server-side AdminStaff profile gate: role-ADMIN is only legitimate when a
  // live (non-deleted) AdminStaff row exists and it is not suspended. This
  // blocks demoted ex-admins and role-ADMIN users with no profile from the
  // whole admin surface at the layout level (S1/A3), independently of the
  // tRPC procedure gate.
  const staff = await getPrismaClient().adminStaff.findUnique({
    where: { userId: session.user.id, deletedAt: null },
    select: { status: true },
  });

  if (!staff) {
    return <AccessDenied reason="admin-profile-missing" />;
  }
  if (staff.status === "SUSPENDED") {
    return <AccessDenied reason="suspended" />;
  }

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  const fullUser = await getUser();

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultOpen} className="h-svh">
        <AdminSidebar user={fullUser} />
        <SidebarInset className="min-h-0 min-w-0 bg-bg-base relative">
          <div className="absolute right-4 top-1.5 z-40">
            <NotificationInbox />
          </div>
          <main className="flex min-h-0 flex-1 flex-col">{children}</main>
          <Toaster />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
