import { OperatorFleetView } from "@/features/operator/views/operator-fleet-view";
import { HydrateClient } from "@/trpc/server";

export const metadata = {
  title: "Fleet Management — Moja Ride Operator",
  description:
    "Manage your vehicle fleet, view seat maps, and track maintenance statuses.",
};

/**
 * Do not prefetch fleet lists here — SUPPORT without fleet:read would hit FORBIDDEN
 * during RSC prefetch. The client view loads data only when permitted.
 */
export default function FleetPage() {
  return (
    <HydrateClient>
      <OperatorFleetView />
    </HydrateClient>
  );
}
