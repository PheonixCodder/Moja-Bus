import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { OperatorPromotionsView } from "@/features/operator/views/operator-promotions-view";

export const metadata = {
  title: "Promotions — Operator",
  description: "Create and manage operator-funded discount codes.",
};

export default async function OperatorPromotionsPage() {
  await prefetch(
    trpc.discountsOperator.listCampaigns.queryOptions({
      limit: 50,
      offset: 0,
    }),
  );

  return (
    <HydrateClient>
      <OperatorPromotionsView />
    </HydrateClient>
  );
}
