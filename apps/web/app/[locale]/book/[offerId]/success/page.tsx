import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { BookingSuccessView } from "@/features/booking/views/booking-success-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";

type Props = {
  params: Promise<{ locale: string; offerId: string }>;
  searchParams: Promise<{
    refs?: string;
    /** Short-lived presentation tokens (preferred). */
    pt?: string;
    /** Legacy durable tokens — still accepted during grace. */
    tokens?: string;
    total?: string;
  }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "booking.success" });
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

interface BookingSuccessPageProps {
  params: Promise<{ offerId: string }>;
  searchParams: Promise<{
    refs?: string;
    pt?: string;
    tokens?: string;
    total?: string;
  }>;
}

export default async function BookingSuccessPage({
  params,
  searchParams,
}: BookingSuccessPageProps) {
  const { offerId: rawOfferId } = await params;
  const offerId = decodeURIComponent(rawOfferId);
  const query = await searchParams;

  const references = query.refs?.split(",").filter(Boolean) ?? [];
  const rawAccess =
    query.pt?.split(",").filter(Boolean) ??
    query.tokens?.split(",").filter(Boolean) ??
    [];
  const total = query.total ? Number(query.total) : 0;

  await prefetch(trpc.booking.getTripDetails.queryOptions({ offerId }));
  for (const token of rawAccess) {
    // Query key must match client (presentation or raw); router resolves pt.*
    await prefetch(
      trpc.booking.getTicketByToken.queryOptions({ ticketToken: token }),
    );
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
        <BookingSuccessView
          offerId={offerId}
          references={references}
          accessTokens={rawAccess}
          total={total}
        />
      </Suspense>
    </HydrateClient>
  );
}
