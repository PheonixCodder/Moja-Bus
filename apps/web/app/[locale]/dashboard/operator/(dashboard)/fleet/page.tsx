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
