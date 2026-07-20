import { OperatorReviewsView } from "@/features/operator/views/operator-reviews-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";

export const metadata = {
  title: "Reviews - Moja Ride Operator Dashboard",
  description:
    "Read passenger reviews and respond to feedback about your trips.",
};

export default async function OperatorReviewsPage() {
  await prefetch(trpc.operator.listReviews.queryOptions());

  return (
    <HydrateClient>
      <OperatorReviewsView />
    </HydrateClient>
  );
}
