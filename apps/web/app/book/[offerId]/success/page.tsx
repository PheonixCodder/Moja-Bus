import { Suspense } from "react";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { BookingSuccessView } from "@/features/booking/views/booking-success-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";

export const metadata = {
  title: "Booking Confirmed - Moja Ride",
  description: "Your bus booking has been confirmed.",
};

interface BookingSuccessPageProps {
  params: Promise<{ offerId: string }>;
  searchParams: Promise<{
    refs?: string;
    tokens?: string;
    total?: string;
  }>;
}

export default async function BookingSuccessPage({
  params,
  searchParams,
}: BookingSuccessPageProps) {
  const { offerId: rawOfferId } = await params;
  const offerId = decodeURIComponent(rawOfferId);
  const query = await searchParams;

  const references = query.refs?.split(",").filter(Boolean) ?? [];
  const tokens = query.tokens?.split(",").filter(Boolean) ?? [];
  const total = query.total ? Number(query.total) : 0;

  await prefetch(trpc.booking.getTripDetails.queryOptions({ offerId }));
  for (const token of tokens) {
    await prefetch(
      trpc.booking.getTicketByToken.queryOptions({ ticketToken: token }),
    );
  }

  return (
    <HydrateClient>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <Spinner className="size-8 text-[#ee237c]" />
          </div>
        }
      >
        <BookingSuccessView
          offerId={offerId}
          references={references}
          tokens={tokens}
          total={total}
        />
      </Suspense>
    </HydrateClient>
  );
}
