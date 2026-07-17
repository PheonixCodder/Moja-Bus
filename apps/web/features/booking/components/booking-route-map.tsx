"use client";

import * as React from "react";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
// Leaflet CSS is loaded dynamically below in JSX via CDN link tag to prevent webpack resolution errors for relative assets.
import { Map as MapIcon, Navigation } from "lucide-react";
import type { PassengerBookingSummary } from "@moja/types";
import { Badge } from "@moja/ui/components/ui/badge";
import { Spinner } from "@moja/ui/components/ui/spinner";

// ─────────────────────────────────────────────────────────
// Map Asset Fixes
// ─────────────────────────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─────────────────────────────────────────────────────────
// Branded Icons
// ─────────────────────────────────────────────────────────
function createBrandedIcon(isOrigin: boolean) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width: ${isOrigin ? "10px" : "14px"};
      height: ${isOrigin ? "10px" : "14px"};
      background: ${isOrigin ? "#9333ea" : "#ee237c"};
      border: 2.5px solid #fff;
      border-radius: 50%;
      box-shadow: 0 1px 4px rgba(0,0,0,0.25);
    "></div>`,
    iconSize: [isOrigin ? 10 : 14, isOrigin ? 10 : 14],
    iconAnchor: [isOrigin ? 5 : 7, isOrigin ? 5 : 7],
  });
}

// ─────────────────────────────────────────────────────────
// Auto-Fit Bounds Component
// ─────────────────────────────────────────────────────────
function FitBounds({
  origin,
  destination,
}: {
  origin: [number, number];
  destination: [number, number];
}) {
  const map = useMap();

  useEffect(() => {
    if (origin && destination) {
      const bounds = L.latLngBounds(origin, destination);
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    }
  }, [map, origin, destination]);

  return null;
}

// ─────────────────────────────────────────────────────────
// Fallback Banner
// ─────────────────────────────────────────────────────────
function EmptyMapBanner({ booking }: { booking: PassengerBookingSummary | null }) {
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
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Origin</span>
            <span className="font-semibold">{booking.originCityName}</span>
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Destination</span>
            <span className="font-semibold">{booking.destinationCityName}</span>
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
          <span>{booking.originTerminalName}</span>
          <span>{booking.destinationTerminalName}</span>
        </div>
      </div>
      
      <Badge variant="outline" className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-md">
        Standard Route
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

  // Note: Leaflet expects [latitude, longitude]
  const origin: [number, number] | null = booking.originCoordinates
    ? [booking.originCoordinates[1], booking.originCoordinates[0]]
    : null;

  const destination: [number, number] | null = booking.destinationCoordinates
    ? [booking.destinationCoordinates[1], booking.destinationCoordinates[0]]
    : null;

  // Fallback if either coordinate is missing
  if (!origin || !destination) {
    return <EmptyMapBanner booking={booking} />;
  }

  return (
    <div className="relative h-full w-full">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <MapContainer
        center={origin}
        zoom={6}
        className="h-full w-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <Polyline
          positions={[origin, destination]}
          pathOptions={{
            color: "#ee237c",
            weight: 3,
            dashArray: "10, 10",
            lineCap: "round",
          }}
        />

        <Marker position={origin} icon={createBrandedIcon(true)} />
        <Marker position={destination} icon={createBrandedIcon(false)} />

        <FitBounds origin={origin} destination={destination} />
      </MapContainer>

      {/* Origin/Dest floating overlay badge for extra context */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 rounded-lg border bg-background/90 p-2 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs">
          <div className="size-2 rounded-full bg-[#9333ea]" />
          <span className="font-medium">{booking.originCityName}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="size-2 rounded-full border-2 border-[#ee237c]" />
          <span className="font-medium">{booking.destinationCityName}</span>
        </div>
      </div>
    </div>
  );
}
