"use client";

import QRCode from "react-qr-code";
import { useTranslations } from "next-intl";
import { formatDateWithWeekday } from "@/lib/format-date";
import { formatDepartureTime, formatPriceXOF } from "@/features/search/lib/format";
import type { DigitalTicketDTO } from "@moja/types";
import { Calendar, User, Armchair, Ticket } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import { UrbanBadge } from "@/components/urban-badge";
import { formatLocationLabel } from "@/lib/format-location-label";

interface DigitalTicketCardProps {
  ticket: DigitalTicketDTO;
  compact?: boolean;
}

export function DigitalTicketCard({ ticket, compact = false }: DigitalTicketCardProps) {
  const t = useTranslations("passengerDashboard.tickets");
  const tTicket = useTranslations("ticket");

  return (
    <div
      className={cn(
        "rounded-[24px] border border-border bg-white overflow-hidden relative shadow-sm",
        "print:shadow-none print:border-slate-300 print:rounded-xl print:bg-white",
        compact ? "p-4" : "p-6 sm:p-7"
      )}
    >
      {/* Decorative ambient background blur */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none print:hidden" />
      <div className="absolute left-0 bottom-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none print:hidden" />

      {/* Printable Platform Header — visible ONLY when printing */}
      <div className="hidden print:flex items-center justify-between border-b border-slate-200 pb-3 mb-4 w-full">
        <div className="flex items-center gap-2">
          <Ticket className="size-5 text-[#ee237c]" />
          <span className="text-base font-extrabold text-slate-900 tracking-tight font-display">
            Moja Ride
          </span>
        </div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          {tTicket("digitalBoardingPass")}
        </span>
      </div>

      <div className={cn(
        "flex relative z-10",
        compact ? "flex-col items-center gap-6 print:flex-row print:items-start print:gap-6" : "flex-col md:flex-row items-center md:items-start gap-8"
      )}>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] shrink-0 print:p-2.5 print:shadow-none print:border-slate-200">
          <QRCode
            value={ticket.qrPayload}
            size={compact ? 180 : 160}
            className="mx-auto print:size-[140px]"
          />
        </div>

        <div className="flex-1 space-y-5 text-center md:text-left print:text-left w-full">
          <div className={cn("flex flex-col", compact ? "items-center print:items-start" : "items-center md:items-start")}>
            <div className="flex flex-wrap items-center justify-center print:justify-start gap-2 mb-2">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-1 rounded-full print:bg-slate-100 print:text-slate-900 print:border print:border-slate-300">
                {ticket.companyName}
              </span>
              {ticket.serviceType === "URBAN" && <UrbanBadge />}
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight font-display">
              {formatLocationLabel({ cityName: ticket.originCityName, municipalityName: ticket.originMunicipalityName, quarterName: ticket.originQuarterName, isUrban: ticket.serviceType === "URBAN" })} <span className="text-slate-300 mx-1">→</span> {formatLocationLabel({ cityName: ticket.destinationCityName, municipalityName: ticket.destinationMunicipalityName, quarterName: ticket.destinationQuarterName, isUrban: ticket.serviceType === "URBAN" })}
            </h3>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              {ticket.originTerminalName}{ticket.originQuarterName ? ` · ${ticket.originQuarterName}` : ""} <span className="mx-1 opacity-50">→</span> {ticket.destinationTerminalName}{ticket.destinationQuarterName ? ` · ${ticket.destinationQuarterName}` : ""}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs border-y border-dashed border-slate-200 py-4 w-full">
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 flex items-center gap-1 justify-center md:justify-start print:justify-start">
                {t("cardDeparture")}
              </p>
              <p className="font-semibold text-slate-900 text-sm">
                {formatDepartureTime(ticket.departureTime)}
              </p>
              <p className="text-[10px] font-semibold text-slate-400">
                {formatDateWithWeekday(ticket.departureTime)}
              </p>
            </div>
            <div className="space-y-1 border-l border-slate-100 pl-4">
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 flex items-center gap-1 justify-center md:justify-start print:justify-start">
                {t("cardSeat")}
              </p>
              <p className="font-semibold text-slate-900 text-sm">
                {ticket.seatLabel}
              </p>
            </div>
            <div className="space-y-1 pt-2">
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 flex items-center gap-1 justify-center md:justify-start print:justify-start">
                {t("cardPassenger")}
              </p>
              <p className="font-semibold text-slate-900 truncate max-w-[140px] print:max-w-none print:whitespace-normal mx-auto md:mx-0 print:mx-0">
                {ticket.passengerName}
              </p>
            </div>
            <div className="space-y-1 border-l border-slate-100 pl-4 pt-2">
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 flex items-center gap-1 justify-center md:justify-start print:justify-start">
                {t("cardArrival")}
              </p>
              <p className="font-semibold text-slate-900">
                {formatDepartureTime(ticket.arrivalTime)}
              </p>
              <p className="text-[10px] font-semibold text-slate-400">
                {formatDateWithWeekday(ticket.arrivalTime)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}