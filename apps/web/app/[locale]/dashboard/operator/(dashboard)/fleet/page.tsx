import { getTranslations } from "next-intl/server";
import { OperatorFleetView } from "@/features/operator/views/operator-fleet-view";
import { HydrateClient } from "@/trpc/server";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "operatorDashboard.fleet" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

/**
 * Fleet page — client view handles IAM gating.
 * Users without fleet:read will see an access denied state.
 */
export default function FleetPage() {
  return (
    <HydrateClient>
      <OperatorFleetView />
    </HydrateClient>
  );
}
