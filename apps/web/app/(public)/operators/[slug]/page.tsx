import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prefetch, trpc, HydrateClient } from "@/trpc/server";
import { OperatorProfilePage } from "@/features/operators/components/operator-profile-page";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  // We do a lightweight fetch here for metadata only; full data is prefetched below
  try {
    const caller = await import("@/trpc/server").then((m) => m.trpc);
    // We use prefetch directly — metadata will be based on slug for now
    return {
      title: `Operator Profile — Moja Ride`,
      description: `View routes, schedules, and terminals for this Moja Ride partner operator.`,
    };
  } catch {
    return { title: "Operator — Moja Ride" };
  }
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
