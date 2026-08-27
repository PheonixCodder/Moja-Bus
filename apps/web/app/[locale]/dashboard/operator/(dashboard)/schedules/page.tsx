import { getTranslations } from "next-intl/server";
import { OperatorSchedulesView } from "@/features/operator/views/operator-schedules-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "operatorDashboard.schedules",
  });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function SchedulesPage() {
  await prefetch(trpc.schedules.list.queryOptions({}));

  return (
    <HydrateClient>
      <OperatorSchedulesView />
    </HydrateClient>
  );
}
