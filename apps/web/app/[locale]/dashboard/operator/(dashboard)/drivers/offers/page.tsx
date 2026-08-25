import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { OperatorSentOffersView } from "@/features/operator/views/operator-sent-offers-view";

export async function generateMetadata() {
  return {
    title: "Sent Offers | Moja Operator",
    description:
      "Track employment offers sent to drivers — responses, counter-proposals, and expirations.",
  };
}

export default async function SentOffersPage() {
  // Prefetch the active offers server-side for instant first paint
  prefetch(
    trpc.drivers.listSentOffers.queryOptions({
      status: "ACTIVE",
      page: 1,
      limit: 20,
    })
  );

  return (
    <HydrateClient>
      <OperatorSentOffersView />
    </HydrateClient>
  );
}
