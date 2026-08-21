import { getTranslations } from "next-intl/server";
import { OperatorDriversView } from "@/features/operator/views/operator-drivers-view";
import { HydrateClient } from "@/trpc/server";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return {
    title: "Driver Fleet Management | Moja Operator",
    description: "Manage commercial drivers, license verifications, and real-time trip allocations.",
  };
}

export default function DriversPage() {
  return (
    <HydrateClient>
      <OperatorDriversView />
    </HydrateClient>
  );
}
