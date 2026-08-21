import { OperatorFleetMapView } from "@/features/operator/views/operator-fleet-map-view";
import { HydrateClient } from "@/trpc/server";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return {
    title: "Live Fleet Telemetry Map | Moja Operator",
    description: "Real-time live map tracking of dispatched buses and driver locations.",
  };
}

export default function DriversMapPage() {
  return (
    <HydrateClient>
      <OperatorFleetMapView />
    </HydrateClient>
  );
}
