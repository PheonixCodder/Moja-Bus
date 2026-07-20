import { OperatorStaffView } from "@/features/operator/views/operator-staff-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";

export const metadata = {
  title: "Staff Management - Moja Ride Operator Dashboard",
  description:
    "Manage your team, invite members, assign roles, and track organization activity.",
};

export default async function OperatorStaffPage() {
  // Prefetch with exact default args that match the client-side useQuery defaults.
  // search: undefined, role: undefined, status: undefined, page: 1, limit: 50
  // This ensures the SSR cache is a perfect hit on first client render.
  await Promise.all([
    prefetch(
      trpc.staff.listStaff.queryOptions({
        search: undefined,
        role: undefined,
        status: undefined,
        page: 1,
        limit: 50,
      }),
    ),
    prefetch(trpc.staff.listInvitations.queryOptions({ limit: 20 })),
    prefetch(trpc.staff.getActivityLog.queryOptions({ limit: 100 })),
    prefetch(trpc.staff.getMyRole.queryOptions()),
  ]);

  return (
    <HydrateClient>
      <OperatorStaffView />
    </HydrateClient>
  );
}
