import { PageHeader } from "@/features/dashboard/components/page-header";
import { TicketDetailView } from "@/features/booking/views/ticket-detail-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";

interface TicketDetailPageProps {
  params: Promise<{ reference: string }>;
}

export async function generateMetadata({ params }: TicketDetailPageProps) {
  const { reference } = await params;
  return {
    title: `Ticket ${decodeURIComponent(reference)} — Moja Ride`,
  };
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const { reference: rawRef } = await params;
  const bookingReference = decodeURIComponent(rawRef);

  await prefetch(
    trpc.booking.getTicket.queryOptions({ bookingReference }),
  );

  return (
    <HydrateClient>
      <div className="flex flex-1 flex-col">
        <PageHeader title="Ticket" className="lg:hidden" />
        <div className="flex flex-1 flex-col p-4 lg:p-8">
          <TicketDetailView bookingReference={bookingReference} />
        </div>
      </div>
    </HydrateClient>
  );
}
