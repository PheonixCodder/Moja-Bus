"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { Bus, Map as MapIcon, MapPinned } from "lucide-react";
import { Badge } from "@moja/ui/components/ui/badge";
import { cn } from "@moja/ui/lib/utils";
import type { Amenity, SearchServiceType } from "@moja/types";
import { formatDateWithWeekday } from "@/lib/format-date";
import {
  formatDepartureTime,
  formatPriceXOF,
  formatTripDuration,
} from "@/features/search/lib/format";
import { AmenityChips } from "../lib/amenities";
import { UrbanBadge } from "@/components/urban-badge";
import { formatLocationLabel } from "@/lib/format-location-label";
import type { RouteMapPoint } from "@/features/operator/components/route-map-preview";

const RouteMapPreview = dynamic(
  () => import("@/features/operator/components/route-map-preview"),
  { ssr: false, loading: () => <MapLoadingSkeleton /> },
);

function MapLoadingSkeleton() {
  return (
    <div className="flex h-56 w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 animate-pulse">
      <MapIcon className="size-6 text-slate-300" />
    </div>
  );
}

export interface TripSummaryData {
  companyName: string;
  companyLogoUrl: string | null;
  busTypeName: string;
  originTerminalName: string;
  originCityName: string;
  originMunicipalityName?: string | null;
  originQuarterName?: string | null;
  destinationTerminalName: string;
  destinationCityName: string;
  destinationMunicipalityName?: string | null;
  destinationQuarterName?: string | null;
  departureTime: Date;
  arrivalTime: Date;
  durationMinutes: number;
  stopCount: number;
  isExpress: boolean;
  serviceType: SearchServiceType;
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
    municipalityName?: string | null;
    quarterName?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    scheduledArrival: Date | null;
    scheduledDeparture: Date | null;
    isPickup: boolean;
    isDropoff: boolean;
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
  const t = useTranslations("booking.tripSummary");
  if (availability.status === "SOLD_OUT") {
    return (
      <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 text-[10px] font-semibold py-0.5">
        {t("fullyBooked")}
      </Badge>
    );
  }
  if (availability.status === "FEW_LEFT") {
    return (
      <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border border-amber-200 text-[10px] font-semibold py-0.5">
        {t("seatsLeft", { count: availability.remaining })}
      </Badge>
    );
  }
  return (
    <span className="text-[10px] font-semibold text-emerald-600">
      {t("seatsAvailable", { count: availability.remaining })}
    </span>
  );
}

function StopTag({
  tone,
  children,
}: {
  tone: "emerald" | "blue" | "slate";
  children: ReactNode;
}) {
  const styles = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    slate: "bg-slate-100 text-slate-600 border-slate-200",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-1.5 py-px text-[9px] font-semibold",
        styles[tone],
      )}
    >
      {children}
    </span>
  );
}

function StopsTimeline({
  stops,
  serviceType,
}: {
  stops: NonNullable<TripSummaryData["stops"]>;
  serviceType: SearchServiceType;
}) {
  const t = useTranslations("booking.tripSummary");

  return (
    <ol>
      {stops.map((stop, index) => {
        const isFirst = index === 0;
        const isLast = index === stops.length - 1;
        const hasArrival = !isFirst && stop.scheduledArrival !== null;
        const hasDeparture = !isLast && stop.scheduledDeparture !== null;
        const nextStop = stops[index + 1];
        const legMinutes =
          !isLast && stop.scheduledDeparture && nextStop?.scheduledArrival
            ? Math.round(
                (nextStop.scheduledArrival.getTime() -
                  stop.scheduledDeparture.getTime()) /
                  60000,
              )
            : null;

        const showTimesPair = hasArrival && hasDeparture;
        const dotClasses = isFirst
          ? "bg-[#ee237c] border-[#ee237c]"
          : isLast
            ? "bg-slate-700 border-slate-700"
            : "bg-white border-slate-300";

        return (
          <li key={stop.id} className="flex gap-3">
            <div className="flex w-16 shrink-0 flex-col items-end text-right leading-4">
              {hasArrival && (
                <span className="text-[10px] text-slate-400">
                  <span className="font-semibold">{t("arrLabel")}</span>{" "}
                  {formatDepartureTime(stop.scheduledArrival!)}
                </span>
              )}
              {hasDeparture && (
                <span className="text-[10px] font-bold text-slate-700">
                  <span className="font-semibold text-slate-400">
                    {t("depLabel")}
                  </span>{" "}
                  {formatDepartureTime(stop.scheduledDeparture!)}
                </span>
              )}
            </div>

            <div className="flex flex-col items-center">
              {showTimesPair && <div className="h-4" />}
              <div
                className={cn(
                  "mt-0.5 h-3 w-3 shrink-0 rounded-full border-2",
                  dotClasses,
                )}
              />
              {!isLast && (
                <div className="relative w-px flex-1 bg-slate-200">
                  {legMinutes !== null && (
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 whitespace-nowrap bg-white px-1 text-[9px] font-semibold text-slate-400">
                      {t("legDuration", {
                        time: formatTripDuration(legMinutes),
                      })}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 pb-5">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-xs font-bold text-slate-700">
                  {stop.terminalName}
                </p>
                {isFirst && <StopTag tone="emerald">{t("boarding")}</StopTag>}
                {isLast && <StopTag tone="slate">{t("alight")}</StopTag>}
                {!isFirst && !isLast && stop.isPickup && (
                  <StopTag tone="emerald">{t("pickup")}</StopTag>
                )}
                {!isFirst && !isLast && stop.isDropoff && (
                  <StopTag tone="blue">{t("dropoff")}</StopTag>
                )}
              </div>
              <p className="truncate text-[10px] font-semibold text-slate-400">
                {formatLocationLabel({
                  cityName: stop.cityName,
                  municipalityName: stop.municipalityName,
                  quarterName: stop.quarterName,
                  isUrban: serviceType === "URBAN",
                })}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function StopsMap({ stops }: { stops: NonNullable<TripSummaryData["stops"]> }) {
  const t = useTranslations("booking.tripSummary");
  const [showMap, setShowMap] = useState(false);

  const points: RouteMapPoint[] = stops
    .filter(
      (s) => typeof s.latitude === "number" && typeof s.longitude === "number",
    )
    .map((s) => ({
      id: s.id,
      name: s.terminalName,
      cityName: s.cityName,
      latitude: s.latitude!,
      longitude: s.longitude!,
    }));

  if (points.length < 2) return null;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setShowMap((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-800"
      >
        <MapPinned className="size-3.5 text-[#ee237c]" />
        {showMap ? t("hideRouteMap") : t("showRouteMap")}
      </button>

      {showMap && (
        <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
          <div className="h-56">
            <RouteMapPreview points={points} />
          </div>
        </div>
      )}
    </div>
  );
}

export function TripSummaryCard({
  trip,
  seatCount = 1,
  showStops = true,
}: TripSummaryCardProps) {
  const t = useTranslations("booking.tripSummary");
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
                {trip.serviceType === "URBAN" && <UrbanBadge />}
                {trip.isExpress && (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold py-0">
                    {t("express")}
                  </Badge>
                )}
              </h2>
              <p className="text-xs font-semibold text-slate-400">
                {trip.busTypeName}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatLocationLabel({
                  cityName: trip.originCityName,
                  municipalityName: trip.originMunicipalityName,
                  quarterName: trip.originQuarterName,
                  isUrban: trip.serviceType === "URBAN",
                })}{" "}
                →{" "}
                {formatLocationLabel({
                  cityName: trip.destinationCityName,
                  municipalityName: trip.destinationMunicipalityName,
                  quarterName: trip.destinationQuarterName,
                  isUrban: trip.serviceType === "URBAN",
                })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 items-center gap-2 py-2">
            <div className="md:col-span-2">
              <span className="text-lg md:text-xl font-bold font-montserrat text-slate-800">
                {formatDepartureTime(trip.departureTime)}
              </span>
              <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                {formatDateWithWeekday(trip.departureTime)}
              </p>
              <p className="text-xs font-bold text-slate-500 mt-0.5 truncate">
                {trip.originTerminalName}
              </p>
              <span className="text-[10px] font-semibold text-slate-400">
                {formatLocationLabel({
                  cityName: trip.originCityName,
                  municipalityName: trip.originMunicipalityName,
                  quarterName: trip.originQuarterName,
                  isUrban: trip.serviceType === "URBAN",
                })}
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
                  ? t("directRoute")
                  : t("intermediateStops", { count: trip.stopCount })}
              </span>
            </div>

            <div className="md:col-span-2 text-left md:text-right">
              <span className="text-lg md:text-xl font-bold font-montserrat text-slate-800">
                {formatDepartureTime(trip.arrivalTime)}
              </span>
              <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                {formatDateWithWeekday(trip.arrivalTime)}
              </p>
              <p className="text-xs font-bold text-slate-500 mt-0.5 truncate">
                {trip.destinationTerminalName}
              </p>
              <span className="text-[10px] font-semibold text-slate-400">
                {formatLocationLabel({
                  cityName: trip.destinationCityName,
                  municipalityName: trip.destinationMunicipalityName,
                  quarterName: trip.destinationQuarterName,
                  isUrban: trip.serviceType === "URBAN",
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="hidden md:block w-px bg-slate-100 self-stretch" />

        <div className="flex flex-col items-start md:items-end gap-2 min-w-[140px]">
          <div className="text-left md:text-right">
            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
              {seatCount > 1 ? t("total") : t("perSeat")}
            </span>
            <span className="text-2xl font-black font-montserrat text-[#ee237c] tracking-tight">
              {formatPriceXOF(seatCount > 1 ? totalPrice : trip.priceXOF)}
            </span>
            {seatCount > 1 && (
              <p className="text-[10px] text-slate-500 mt-0.5">
                {t("seatsMultiplier", {
                  price: formatPriceXOF(trip.priceXOF),
                  count: seatCount,
                })}
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
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {t("stopsOnSegment")}
            </p>
            <span className="text-[10px] font-semibold text-slate-400">
              {formatDateWithWeekday(trip.departureTime)}
            </span>
          </div>
          <StopsTimeline stops={trip.stops} serviceType={trip.serviceType} />
          <StopsMap stops={trip.stops} />
        </div>
      )}
    </div>
  );
}
