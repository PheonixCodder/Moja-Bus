import { getTranslations } from "next-intl/server";
import { getPrismaClient } from "@moja/db";
import { getAdminEffectivePermissions } from "@moja/schemas";
import { Separator } from "@moja/ui/components/ui/separator";
import { SidebarTrigger } from "@moja/ui/components/ui/sidebar";
import { AdminStaffView } from "@/features/admin/views/admin-staff-view";
import { getServerSession } from "@/lib/auth-server";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export const metadata = {
  title: "Admin Staff — Moja Ride Admin",
  description: "Manage platform admin team members, roles, and permissions.",
};

export default async function AdminStaffPage() {
  const t = await getTranslations("adminDashboard.pages.staff");
  const session = await getServerSession();
  const staff = session?.user?.id
    ? await getPrismaClient().adminStaff.findUnique({
        where: { userId: session.user.id, deletedAt: null },
        select: { role: true, permissions: true },
      })
    : null;
  const canReadActivity = staff
    ? getAdminEffectivePermissions(
        staff.role,
        staff.permissions ?? [],
      ).includes("audit:read")
    : false;

  const prefetches = [
    prefetch(
      trpc.adminStaff.listStaff.queryOptions({
        search: undefined,
        role: undefined,
        status: undefined,
        page: 1,
        limit: 50,
      }),
    ),
    prefetch(trpc.adminStaff.listInvitations.queryOptions({ limit: 20 })),
    prefetch(trpc.adminStaff.getMyPermissions.queryOptions()),
  ];

  if (canReadActivity) {
    prefetches.push(
      prefetch(trpc.adminStaff.getActivityLog.queryOptions({ limit: 100 })),
    );
  }

  await Promise.all(prefetches);

  return (
    <HydrateClient>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-bg-base px-4">
        <SidebarTrigger className="text-text-muted hover:text-text-primary" />
        <Separator orientation="vertical" className="h-4 bg-border" />
        <nav className="flex items-center gap-1 text-xs text-text-muted">
          <span>{t("breadcrumbAdmin")}</span>
          <span className="mx-1 text-text-muted/40">/</span>
          <span className="text-text-primary font-medium">{t("breadcrumbStaff")}</span>
        </nav>
      </header>
      <div className="flex-1 overflow-y-auto">
        <AdminStaffView />
      </div>
    </HydrateClient>
  );
}
