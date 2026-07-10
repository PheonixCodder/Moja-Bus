"use client";

import QRCode from "react-qr-code";
import { formatDepartureTime, formatPriceXOF } from "@/features/search/lib/format";
import type { DigitalTicketDTO } from "@moja/types";
import { Calendar, User, Armchair, Ticket } from "lucide-react";

interface DigitalTicketCardProps {
  ticket: DigitalTicketDTO;
  compact?: boolean;
}

export function DigitalTicketCard({ ticket, compact = false }: DigitalTicketCardProps) {
  return (
    <div
      className={`rounded-2xl border border-border bg-bg-surface overflow-hidden hover:shadow-md transition-shadow relative ${
        compact ? "p-4 sm:p-5" : "p-6"
      }`}
    >
      {/* Visual background accents */}
      <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute left-0 bottom-0 w-16 h-16 bg-neon/5 rounded-full blur-xl pointer-events-none" />

      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start relative z-10">
        {/* QR Code section */}
        <div className="bg-white p-3 rounded-xl border border-border/80 shadow-inner shrink-0 group hover:border-primary/30 transition-colors">
          <QRCode 
            value={ticket.qrPayload} 
            size={compact ? 128 : 160} 
            className="transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>

        {/* Boarding Info section */}
        <div className="flex-1 space-y-4 text-center md:text-left w-full">
          <div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1.5">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                {ticket.companyName}
              </span>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest font-mono">
                {ticket.bookingReference}
              </span>
            </div>
            <h3 className="text-base font-extrabold text-text-primary tracking-tight font-display">
              {ticket.originCityName} → {ticket.destinationCityName}
            </h3>
            <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
              {ticket.originTerminalName} → {ticket.destinationTerminalName}
            </p>
          </div>

          {/* Boarding Pass details grid */}
          <div className="grid grid-cols-2 gap-3 text-xs border-t border-b border-border/60 border-dashed py-3.5">
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold tracking-wider text-text-muted flex items-center gap-1 justify-center md:justify-start">
                <Calendar className="w-3.5 h-3.5 text-text-muted" /> Departure
              </p>
              <p className="font-semibold text-text-primary">
                {formatDepartureTime(ticket.departureTime)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold tracking-wider text-text-muted flex items-center gap-1 justify-center md:justify-start">
                <Calendar className="w-3.5 h-3.5 text-text-muted" /> Arrival (Est)
              </p>
              <p className="font-semibold text-text-primary">
                {formatDepartureTime(ticket.arrivalTime)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold tracking-wider text-text-muted flex items-center gap-1 justify-center md:justify-start">
                <User className="w-3.5 h-3.5 text-text-muted" /> Passenger
              </p>
              <p className="font-semibold text-text-primary truncate max-w-[120px] mx-auto md:mx-0">
                {ticket.passengerName}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold tracking-wider text-text-muted flex items-center gap-1 justify-center md:justify-start">
                <Armchair className="w-3.5 h-3.5 text-text-muted" /> Seat
              </p>
              <p className="font-semibold text-text-primary">
                {ticket.seatLabel}
              </p>
            </div>
          </div>

          {/* Pricing stub section */}
          <div className="flex items-center justify-between gap-4 pt-1">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
              <Ticket className="w-3.5 h-3.5 text-text-muted" /> Boarding Pass
            </span>
            <span className="text-sm font-black text-primary">
              {formatPriceXOF(ticket.farePaidXOF)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
