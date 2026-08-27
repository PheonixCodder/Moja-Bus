import { getTranslations } from "next-intl/server";
import { OperatorReviewsView } from "@/features/operator/views/operator-reviews-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "operatorDashboard.reviews",
  });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function OperatorReviewsPage() {
  await prefetch(trpc.operator.listReviews.queryOptions());

  return (
    <HydrateClient>
      <OperatorReviewsView />
    </HydrateClient>
  );
}
