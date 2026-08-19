"use client";

import { useTranslations } from "next-intl";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { DigitalTicketCard } from "@/features/booking/components/digital-ticket-card";
import { PrintTicketButton } from "@/features/booking/components/print-ticket-button";

interface PublicTicketViewProps {
  ticketToken: string;
}

export function PublicTicketView({ ticketToken }: PublicTicketViewProps) {
  const t = useTranslations("ticket");
  const trpc = useTRPC();
  const { data: ticket } = useSuspenseQuery(
    trpc.booking.getTicketByToken.queryOptions({ ticketToken }),
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6 print:py-0 print:px-0 print:max-w-full">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div className="flex gap-3 items-start">
          <ShieldCheck className="size-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-sm text-emerald-900">
            <p className="font-semibold">{t("validTicket")}</p>
            <p className="text-emerald-800/90 mt-0.5 text-xs">
              {t("validTicketDesc")}
            </p>
          </div>
        </div>
        <PrintTicketButton size="sm" className="shrink-0 self-end sm:self-center" />
      </div>

      <div className="print:break-inside-avoid">
        <DigitalTicketCard ticket={ticket} />
      </div>

      <p className="text-center text-xs text-slate-500 print:text-slate-700 print:mt-4">
        {t("refSeat", { ref: ticket.bookingReference, seat: ticket.seatLabel })}
      </p>
    </div>
  );
}
