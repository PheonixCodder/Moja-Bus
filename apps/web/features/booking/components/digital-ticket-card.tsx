"use client";

import QRCode from "react-qr-code";
import { formatDepartureTime, formatPriceXOF } from "@/features/search/lib/format";
import type { DigitalTicketDTO } from "@moja/types";
import { Calendar, User, Armchair, Ticket } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";

interface DigitalTicketCardProps {
  ticket: DigitalTicketDTO;
  compact?: boolean;
}

export function DigitalTicketCard({ ticket, compact = false }: DigitalTicketCardProps) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-border bg-white overflow-hidden relative shadow-sm",
        compact ? "p-5" : "p-8"
      )}
    >
      {/* Visual background accents */}
      <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-0 bottom-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

      <div className={cn(
        "flex relative z-10",
        compact ? "flex-col items-center gap-6" : "flex-col md:flex-row items-center md:items-start gap-8"
      )}>
        {/* QR Code section */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] shrink-0">
          <QRCode 
            value={ticket.qrPayload} 
            size={compact ? 180 : 160} 
            className="mx-auto"
          />
        </div>

        {/* Boarding Info section */}
        <div className="flex-1 space-y-5 text-center md:text-left w-full">
          <div className={cn("flex flex-col", compact ? "items-center" : "items-center md:items-start")}>
            <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-1 rounded-full">
                {ticket.companyName}
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight font-display">
              {ticket.originCityName} <span className="text-slate-300 mx-1">→</span> {ticket.destinationCityName}
            </h3>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              {ticket.originTerminalName} <span className="mx-1 opacity-50">→</span> {ticket.destinationTerminalName}
            </p>
          </div>

          {/* Boarding Pass details grid */}
          <div className="grid grid-cols-2 gap-4 text-xs border-y border-dashed border-slate-200 py-4 w-full">
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 flex items-center gap-1 justify-center md:justify-start">
                Departure
              </p>
              <p className="font-semibold text-slate-900 text-sm">
                {formatDepartureTime(ticket.departureTime)}
              </p>
            </div>
            <div className="space-y-1 border-l border-slate-100 pl-4">
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 flex items-center gap-1 justify-center md:justify-start">
                Seat
              </p>
              <p className="font-semibold text-slate-900 text-sm">
                {ticket.seatLabel}
              </p>
            </div>
            <div className="space-y-1 pt-2">
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 flex items-center gap-1 justify-center md:justify-start">
                Passenger
              </p>
              <p className="font-semibold text-slate-900 truncate max-w-[140px] mx-auto md:mx-0">
                {ticket.passengerName}
              </p>
            </div>
            <div className="space-y-1 border-l border-slate-100 pl-4 pt-2">
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 flex items-center gap-1 justify-center md:justify-start">
                Arrival (Est)
              </p>
              <p className="font-semibold text-slate-900">
                {formatDepartureTime(ticket.arrivalTime)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
