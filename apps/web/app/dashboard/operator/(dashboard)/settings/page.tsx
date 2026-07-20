import { OperatorSettingsView } from "@/features/operator/views/operator-settings-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";

export const metadata = {
  title: "Company Settings - Moja Ride Operator Dashboard",
  description:
    "Manage company profile details, banking, compliance documents, and verification.",
};

export default async function OperatorSettingsPage() {
  await prefetch(trpc.operator.getSettings.queryOptions());

  return (
    <HydrateClient>
      <OperatorSettingsView />
    </HydrateClient>
  );
}
