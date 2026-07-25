import { getTranslations } from "next-intl/server";
import { OperatorTerminalsView } from "@/features/operator/views/operator-terminals-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "operatorDashboard.terminals" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function OperatorTerminalsPage() {
  await Promise.all([
    prefetch(trpc.terminals.list.queryOptions()),
    prefetch(trpc.routes.getCities.queryOptions()),
  ]);

  return (
    <HydrateClient>
      <OperatorTerminalsView />
    </HydrateClient>
  );
}
