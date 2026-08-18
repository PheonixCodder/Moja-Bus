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
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <OperatorPromotionsView />
      </div>
    </HydrateClient>
  );
}
