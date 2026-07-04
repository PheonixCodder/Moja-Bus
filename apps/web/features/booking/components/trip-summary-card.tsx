import Image from "next/image";
import { Bus } from "lucide-react";
import { Badge } from "@moja/ui/components/ui/badge";
import type { Amenity } from "@moja/types";
import {
  formatDepartureTime,
  formatPriceXOF,
  formatTripDuration,
} from "@/features/search/lib/format";
import { AmenityChips } from "../lib/amenities";

export interface TripSummaryData {
  companyName: string;
  companyLogoUrl: string | null;
  busTypeName: string;
  originTerminalName: string;
  originCityName: string;
  destinationTerminalName: string;
  destinationCityName: string;
  departureTime: Date;
  arrivalTime: Date;
  durationMinutes: number;
  stopCount: number;
  isExpress: boolean;
  priceXOF: number;
  amenities: Amenity[];
  availability: {
    remaining: number;
    status: "AVAILABLE" | "FEW_LEFT" | "SOLD_OUT";
  };
  stops?: Array<{
    id: string;
    terminalName: string;
    cityName: string;
    scheduledDeparture: Date | null;
  }>;
}

interface TripSummaryCardProps {
  trip: TripSummaryData;
  /** When set, shows total for multi-seat selection */
  seatCount?: number;
  showStops?: boolean;
}

function AvailabilityBadge({
  availability,
}: {
  availability: TripSummaryData["availability"];
}) {
  if (availability.status === "SOLD_OUT") {
    return (
      <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 text-[10px] font-semibold py-0.5">
        Fully Booked
      </Badge>
    );
  }
  if (availability.status === "FEW_LEFT") {
    return (
      <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border border-amber-200 text-[10px] font-semibold py-0.5">
        Only {availability.remaining} seats left
      </Badge>
    );
  }
  return (
    <span className="text-[10px] font-semibold text-emerald-600">
      {availability.remaining} seats available
    </span>
  );
}

export function TripSummaryCard({
  trip,
  seatCount = 1,
  showStops = true,
}: TripSummaryCardProps) {
  const totalPrice = trip.priceXOF * seatCount;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-grow space-y-4">
          <div className="flex items-center gap-3">
            {trip.companyLogoUrl ? (
              <Image
                src={trip.companyLogoUrl}
                alt={trip.companyName}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full border border-pink-200 object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-pink-100 border border-pink-200 text-[#ee237c] font-black flex items-center justify-center tracking-tighter text-sm">
                {trip.companyName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="font-bold text-slate-800 flex items-center gap-2 leading-tight text-lg">
                {trip.companyName}
                {trip.isExpress && (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold py-0">
                    Express
                  </Badge>
                )}
              </h2>
              <p className="text-xs font-semibold text-slate-400">
                {trip.busTypeName}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {trip.originCityName} → {trip.destinationCityName}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 items-center gap-2 py-2">
            <div className="md:col-span-2">
              <span className="text-lg md:text-xl font-bold font-montserrat text-slate-800">
                {formatDepartureTime(trip.departureTime)}
              </span>
              <p className="text-xs font-bold text-slate-500 mt-0.5 truncate">
                {trip.originTerminalName}
              </p>
              <span className="text-[10px] font-semibold text-slate-400">
                {trip.originCityName}
              </span>
            </div>

            <div className="md:col-span-3 flex flex-col items-center justify-center px-4 my-2 md:my-0">
              <span className="text-xs font-semibold text-slate-400 mb-1">
                {formatTripDuration(trip.durationMinutes)}
              </span>
              <div className="w-full h-[2px] bg-slate-200 relative flex items-center justify-center">
                <div className="absolute h-2 w-2 rounded-full bg-slate-300 left-0" />
                <Bus className="h-4 w-4 text-slate-300 bg-white px-0.5 z-10" />
                <div className="absolute h-2 w-2 rounded-full bg-[#ee237c] right-0" />
              </div>
              <span className="text-[10px] font-semibold text-slate-400 mt-1">
                {trip.stopCount === 0
                  ? "Direct Route"
                  : `${trip.stopCount} intermediate stop${trip.stopCount > 1 ? "s" : ""}`}
              </span>
            </div>

            <div className="md:col-span-2 text-left md:text-right">
              <span className="text-lg md:text-xl font-bold font-montserrat text-slate-800">
                {formatDepartureTime(trip.arrivalTime)}
              </span>
              <p className="text-xs font-bold text-slate-500 mt-0.5 truncate">
                {trip.destinationTerminalName}
              </p>
              <span className="text-[10px] font-semibold text-slate-400">
                {trip.destinationCityName}
              </span>
            </div>
          </div>
        </div>

        <div className="hidden md:block w-px bg-slate-100 self-stretch" />

        <div className="flex flex-col items-start md:items-end gap-2 min-w-[140px]">
          <div className="text-left md:text-right">
            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
              {seatCount > 1 ? "Total" : "Per seat"}
            </span>
            <span className="text-2xl font-black font-montserrat text-[#ee237c] tracking-tight">
              {formatPriceXOF(seatCount > 1 ? totalPrice : trip.priceXOF)}
            </span>
            {seatCount > 1 && (
              <p className="text-[10px] text-slate-500 mt-0.5">
                {formatPriceXOF(trip.priceXOF)} × {seatCount} seats
              </p>
            )}
          </div>
          <AvailabilityBadge availability={trip.availability} />
        </div>
      </div>

      {trip.amenities.length > 0 && (
        <div className="pt-4 border-t border-slate-100">
          <AmenityChips amenities={trip.amenities} />
        </div>
      )}

      {showStops && trip.stops && trip.stops.length > 2 && (
        <div className="pt-4 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Stops on your segment
          </p>
          <ol className="text-xs text-slate-600 space-y-1">
            {trip.stops.map((stop) => (
              <li key={stop.id}>
                {stop.terminalName} ({stop.cityName})
                {stop.scheduledDeparture
                  ? ` — dep ${formatDepartureTime(stop.scheduledDeparture)}`
                  : ""}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
