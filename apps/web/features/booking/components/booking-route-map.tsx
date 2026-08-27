"use client";

import type { PassengerBookingSummary } from "@moja/types";
import { Badge } from "@moja/ui/components/ui/badge";
import { Map as MapIcon, Navigation } from "lucide-react";
import { formatLocationLabel } from "@/lib/format-location-label";
import { useTranslations } from "next-intl";
import RouteMapPreview, {
  type RouteMapPoint,
} from "@/features/operator/components/route-map-preview";

// ─────────────────────────────────────────────────────────
// Fallback Banner
// ─────────────────────────────────────────────────────────
function EmptyMapBanner({
  booking,
}: {
  booking: PassengerBookingSummary | null;
}) {
  const t = useTranslations("booking");
  if (!booking) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted">
        <MapIcon className="size-12 text-muted-foreground/30" />
      </div>
    );
  }

  // Pure CSS route diagram if coordinates are missing
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-muted/30 p-8">
      {/* Decorative map pattern background */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:invert"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.83v58.34h-58.34l-.83-.83V0h58.34zM27 27V12h6v15h15v6H33v15h-6V33H12v-6h15z' fill='%23000000' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="z-10 flex w-full max-w-sm flex-col gap-6 rounded-2xl border bg-background/80 p-6 shadow-sm backdrop-blur-md">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("routeMap.origin")}
            </span>
            <span className="font-semibold">
              {formatLocationLabel({
                cityName: booking.originCityName,
                municipalityName: booking.originMunicipalityName,
                quarterName: booking.originQuarterName,
                isUrban: booking.serviceType === "URBAN",
              })}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("routeMap.destination")}
            </span>
            <span className="font-semibold">
              {formatLocationLabel({
                cityName: booking.destinationCityName,
                municipalityName: booking.destinationMunicipalityName,
                quarterName: booking.destinationQuarterName,
                isUrban: booking.serviceType === "URBAN",
              })}
            </span>
          </div>
        </div>

        <div className="relative flex items-center gap-2">
          <div className="grid size-4 shrink-0 place-items-center rounded-full bg-primary/20">
            <div className="size-1.5 rounded-full bg-primary" />
          </div>
          <div className="h-px min-w-0 flex-1 border-t-2 border-dashed border-primary/30" />
          <Navigation className="size-4 rotate-90 text-primary/40" />
          <div className="h-px min-w-0 flex-1 border-t-2 border-dashed border-primary/30" />
          <div className="grid size-4 shrink-0 place-items-center rounded-full border-2 border-primary bg-background">
            <div className="size-1.5 rounded-full bg-primary" />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {booking.originTerminalName}
            {booking.originQuarterName ? ` · ${booking.originQuarterName}` : ""}
          </span>
          <span>
            {booking.destinationTerminalName}
            {booking.destinationQuarterName
              ? ` · ${booking.destinationQuarterName}`
              : ""}
          </span>
        </div>
      </div>

      <Badge
        variant="outline"
        className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-md"
      >
        {t("routeMap.standardRoute")}
      </Badge>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────
export type BookingRouteMapProps = {
  booking: PassengerBookingSummary | null;
};

export default function BookingRouteMap({ booking }: BookingRouteMapProps) {
  if (!booking) return <EmptyMapBanner booking={null} />;

  const points: RouteMapPoint[] = (booking.stops ?? [])
    .filter((s) => s.latitude != null && s.longitude != null)
    .map((s) => ({
      id: `${s.stopOrder}`,
      name: s.terminalName,
      cityName: s.cityName,
      latitude: s.latitude!,
      longitude: s.longitude!,
    }));

  if (points.length < 2) {
    return <EmptyMapBanner booking={booking} />;
  }

  return (
    <div className="relative h-full w-full">
      <RouteMapPreview points={points} />

      {/* Origin/Dest floating overlay badge for extra context */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 rounded-lg border bg-background/90 p-2 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs">
          <div className="size-2 rounded-full bg-[#9333ea]" />
          <span className="font-medium">
            {formatLocationLabel({
              cityName: booking.originCityName,
              municipalityName: booking.originMunicipalityName,
              quarterName: booking.originQuarterName,
              isUrban: booking.serviceType === "URBAN",
            })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="size-2 rounded-full border-2 border-[#ee237c]" />
          <span className="font-medium">
            {formatLocationLabel({
              cityName: booking.destinationCityName,
              municipalityName: booking.destinationMunicipalityName,
              quarterName: booking.destinationQuarterName,
              isUrban: booking.serviceType === "URBAN",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
