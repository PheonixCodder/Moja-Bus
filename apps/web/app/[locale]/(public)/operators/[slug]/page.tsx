import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prefetch, trpc, HydrateClient } from "@/trpc/server";
import { OperatorProfilePage } from "@/features/operators/components/operator-profile-page";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("operatorProfile");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function OperatorSlugPage({ params }: Props) {
  const { slug } = await params;

  await prefetch(trpc.public.getOperator.queryOptions({ slug }));

  return (
    <HydrateClient>
      <OperatorProfilePage slug={slug} />
    </HydrateClient>
  );
}
