import { DriverDetailView } from "@/features/operator/views/driver-detail-view";
import { HydrateClient } from "@/trpc/server";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return {
    title: `Driver Passport #${id} | Moja Operator`,
    description: "Detailed driver passport, verified license documents, and trip performance analytics.",
  };
}

export default async function DriverDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <HydrateClient>
      <DriverDetailView driverId={id} />
    </HydrateClient>
  );
}
