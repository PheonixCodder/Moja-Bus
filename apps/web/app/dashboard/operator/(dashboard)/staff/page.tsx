import { OperatorStaffView } from "@/features/operator/views/operator-staff-view";
import { SidebarTrigger } from "@moja/ui/components/ui/sidebar";
import { Separator } from "@moja/ui/components/ui/separator";
import { OperatorQuickActions } from "@/features/operator/components/operator-quick-actions";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";

export const metadata = {
  title: "Staff Management - Moja Ride Operator Dashboard",
  description:
    "Manage your team, invite members, assign roles, and track organization activity.",
};

export default async function OperatorStaffPage() {
  await prefetch(trpc.staff.listStaff.queryOptions({}));
  await prefetch(trpc.staff.listInvitations.queryOptions());
  await prefetch(trpc.staff.getActivityLog.queryOptions({ limit: 30 }));
  await prefetch(trpc.staff.getMyRole.queryOptions());

  return (
    <HydrateClient>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-bg-base px-4">
        <SidebarTrigger className="text-text-muted hover:text-text-primary" />
        <Separator orientation="vertical" className="h-4 bg-border" />
        <nav className="flex items-center gap-1 text-xs text-text-muted">
          <span>Operations</span>
          <span className="mx-1 text-text-muted/40">/</span>
          <span className="text-text-primary font-medium">Staff Management</span>
        </nav>
        <OperatorQuickActions />
      </header>
      <OperatorStaffView />
    </HydrateClient>
  );
}
