import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { BookingOfferView } from "@/features/booking/views/booking-offer-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";

export const metadata = {
  title: "Book Trip - Moja Ride",
  description: "Select seats and complete your intercity bus booking.",
};

interface BookOfferPageProps {
  params: Promise<{ offerId: string }>;
}

export default async function BookOfferPage({ params }: BookOfferPageProps) {
  const { offerId: rawOfferId } = await params;
  const offerId = decodeURIComponent(rawOfferId);

  try {
    await Promise.all([
      prefetch(trpc.booking.getTripDetails.queryOptions({ offerId })),
      prefetch(trpc.booking.getSeatAvailability.queryOptions({ offerId })),
    ]);
  } catch {
    notFound();
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
        <BookingOfferView offerId={offerId} />
      </Suspense>
    </HydrateClient>
  );
}
