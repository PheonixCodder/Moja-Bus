"use client";

import QRCode from "react-qr-code";
import { formatDepartureTime, formatPriceXOF } from "@/features/search/lib/format";
import type { DigitalTicketDTO } from "@moja/types";

interface DigitalTicketCardProps {
  ticket: DigitalTicketDTO;
  compact?: boolean;
}

export function DigitalTicketCard({ ticket, compact = false }: DigitalTicketCardProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white overflow-hidden ${
        compact ? "p-4" : "p-6"
      }`}
    >
      <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
        <div className="bg-white p-3 rounded-xl border border-slate-100 shrink-0">
          <QRCode value={ticket.qrPayload} size={compact ? 120 : 160} />
        </div>

        <div className="flex-1 space-y-3 text-center sm:text-left w-full">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {ticket.companyName}
            </p>
            <h3 className="text-lg font-bold text-slate-900">
              {ticket.originCityName} → {ticket.destinationCityName}
            </h3>
            <p className="text-sm text-slate-600">
              {ticket.originTerminalName} → {ticket.destinationTerminalName}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-500">Departure</p>
              <p className="font-semibold text-slate-800">
                {formatDepartureTime(ticket.departureTime)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Arrival</p>
              <p className="font-semibold text-slate-800">
                {formatDepartureTime(ticket.arrivalTime)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Passenger</p>
              <p className="font-semibold text-slate-800">{ticket.passengerName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Seat</p>
              <p className="font-semibold text-slate-800">{ticket.seatLabel}</p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-sm text-slate-700">{ticket.bookingReference}</p>
            <p className="text-sm font-bold text-[#ee237c]">
              {formatPriceXOF(ticket.farePaidXOF)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
