"use client";

import { buttonVariants } from "@moja/ui/components/ui/button";
import { cn } from "@moja/ui/lib/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CheckCircle2, HelpCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DigitalTicketCard } from "@/features/booking/components/digital-ticket-card";
import { TripSummaryCard } from "@/features/booking/components/trip-summary-card";
import { formatPriceXOF } from "@/features/search/lib/format";
import { useTRPC } from "@/trpc/client";

interface BookingSuccessViewProps {
  offerId: string;
  references: string[];
  /** Presentation or legacy durable access tokens from the success URL. */
  accessTokens: string[];
  total: number;
}

function TicketFromToken({ token }: { token: string }) {
  const trpc = useTRPC();
  const { data: ticket } = useSuspenseQuery(
    trpc.booking.getTicketByToken.queryOptions({ ticketToken: token }),
  );
  return <DigitalTicketCard ticket={ticket} compact />;
}

export function BookingSuccessView({
  offerId,
  references,
  accessTokens,
  total,
}: BookingSuccessViewProps) {
  const t = useTranslations("booking.success");
  const trpc = useTRPC();
  const { data: tripDetails } = useSuspenseQuery(
    trpc.booking.getTripDetails.queryOptions({ offerId }),
  );

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm text-center space-y-3">
          <CheckCircle2 className="size-12 text-success mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          {total > 0 && (
            <p className="text-sm font-bold text-primary">
              {t("totalPaid", { amount: formatPriceXOF(total) })}
            </p>
          )}
        </div>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <TripSummaryCard trip={tripDetails} showStops={false} />
        </section>

        {references.length > 0 && (
          <div className="rounded-lg bg-muted/30 border border-border p-4 text-left space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {t("bookingReferences")}
            </p>
            <ul className="text-sm font-mono text-foreground space-y-1">
              {references.map((ref) => (
                <li key={ref}>{ref}</li>
              ))}
            </ul>
          </div>
        )}

        {accessTokens.length > 0 && (
          <div className="space-y-4">
            {accessTokens.map((token) => (
              <TicketFromToken key={token} token={token} />
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Link
            href="/"
            className={cn(
              buttonVariants(),
              "bg-primary hover:bg-primary/90 text-primary-foreground font-bold justify-center shadow-sm",
            )}
          >
            {t("searchTrips")}
          </Link>
          <Link
            href="/dashboard/bookings"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "justify-center",
            )}
          >
            {t("viewBookings")}
          </Link>
        </div>

        <Link
          href="/contact"
          className="flex items-start gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted/40"
        >
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {t("helpTitle")}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("helpBody")}</p>
            <p className="text-xs font-bold text-primary mt-1.5">
              {t("helpContact")} →
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
