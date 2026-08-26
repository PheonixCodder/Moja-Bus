"use client";

import { buttonVariants } from "@moja/ui/components/ui/button";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { cn } from "@moja/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import {
  ArrowLeft,
  CircleOff,
  Clock,
  MapPin,
  Navigation,
  Signal,
  SignalLow,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
} from "react-leaflet";
import { useTRPC } from "@/trpc/client";

// Fix Leaflet default icon paths broken by bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function busIcon(freshness: "fresh" | "stale"): L.DivIcon {
  const color = freshness === "stale" ? "#71717a" : "#e11d48";
  const size = freshness === "fresh" ? 20 : 16;
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;background:${color};border:2.5px solid #fff;border-radius:50%;box-shadow:0 1px 6px rgba(0,0,0,0.3);opacity:${freshness === "stale" ? 0.45 : 1};"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function stopIcon(isEndpoint: boolean): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${isEndpoint ? 14 : 10}px;
      height:${isEndpoint ? 14 : 10}px;
      background:${isEndpoint ? "#ee237c" : "#9333ea"};
      border:2.5px solid #fff;border-radius:50%;
      box-shadow:0 1px 4px rgba(0,0,0,0.25);
    "></div>`,
    iconSize: [isEndpoint ? 14 : 10, isEndpoint ? 14 : 10],
    iconAnchor: [isEndpoint ? 7 : 5, isEndpoint ? 7 : 5],
  });
}

const POLL_INTERVAL_MS = 10_000;
const ABIDJAN_CENTER: [number, number] = [5.3599, -4.0083];

interface TrackingLiveMapProps {
  busLocation: { latitude: number; longitude: number } | null;
  stops: {
    stopOrder: number;
    terminalName: string;
    latitude: number | null;
    longitude: number | null;
  }[];
  boardingStopOrder: number | null;
  dropoffStopOrder: number | null;
}

function TrackingLiveMap({
  busLocation,
  stops,
  boardingStopOrder,
  dropoffStopOrder,
}: TrackingLiveMapProps) {
  const validStops = stops.filter(
    (s) => s.latitude != null && s.longitude != null,
  );

  const center: [number, number] =
    busLocation != null
      ? [busLocation.latitude, busLocation.longitude]
      : validStops.length > 0
        ? [
            (Math.min(...validStops.map((s) => s.latitude!)) +
              Math.max(...validStops.map((s) => s.latitude!))) /
              2,
            (Math.min(...validStops.map((s) => s.longitude!)) +
              Math.max(...validStops.map((s) => s.longitude!))) /
              2,
          ]
        : ABIDJAN_CENTER;

  const polyline: [number, number][] = validStops.map((s) => [
    s.latitude!,
    s.longitude!,
  ]);

  return (
    <MapContainer
      center={center}
      zoom={busLocation != null ? 12 : 7}
      className="size-full z-0"
      preferCanvas
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {polyline.length > 1 && (
        <Polyline
          positions={polyline}
          pathOptions={{
            color: "#ee237c",
            weight: 2.5,
            opacity: 0.75,
            dashArray: "6 4",
          }}
        />
      )}
      {validStops.map((s, i) => {
        const isEndpoint = i === 0 || i === validStops.length - 1;
        return (
          <Marker
            key={s.stopOrder}
            position={[s.latitude!, s.longitude!]}
            icon={stopIcon(isEndpoint)}
          >
            <Popup className="text-xs">
              <strong>{s.terminalName}</strong>
              {s.stopOrder === boardingStopOrder && (
                <span className="ml-1 text-xs text-emerald-600">
                  (Boarding)
                </span>
              )}
              {s.stopOrder === dropoffStopOrder && (
                <span className="ml-1 text-xs text-pink-600">(Drop-off)</span>
              )}
            </Popup>
          </Marker>
        );
      })}
      {busLocation != null && (
        <Marker
          position={[busLocation.latitude, busLocation.longitude]}
          icon={busIcon("fresh")}
        >
          <Popup className="text-xs">
            <strong>Bus</strong>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}

interface PassengerTrackingViewProps {
  tripId: string;
  backHref: string;
}

export function PassengerTrackingView({
  tripId,
  backHref,
}: PassengerTrackingViewProps) {
  const t = useTranslations("passengerDashboard.tracking");
  const trpc = useTRPC();

  // Pause polling when browser tab is hidden
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    function handleVisibility() {
      setIsActive(document.visibilityState === "visible");
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const { data, isLoading, error } = useQuery({
    ...trpc.passenger.getTripTracking.queryOptions(
      { tripId },
      { enabled: !!tripId },
    ),
    refetchInterval: isActive ? POLL_INTERVAL_MS : false,
  });

  // ── Loading ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex h-full min-h-60 flex-col items-center justify-center gap-3">
        <Spinner className="size-6 text-primary" />
        <span className="text-xs text-muted-foreground">{t("loading")}</span>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="flex h-full min-h-60 flex-col items-center justify-center gap-3 px-6">
        <CircleOff className="size-10 text-destructive" />
        <p className="text-sm font-medium text-center">{t("unavailable")}</p>
        <p className="text-xs text-muted-foreground text-center max-w-xs">
          {t("unavailableBody")}
        </p>
      </div>
    );
  }

  // ── Pre-departure ───────────────────────────────────────────────────
  if (data.status === "SCHEDULED" || data.status === "BOARDING") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 px-4 py-2 border-b">
          <Link
            href={backHref}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-1.5 text-xs",
            )}
          >
            <ArrowLeft className="size-3.5" />
            {t("backToBookings")}
          </Link>
          <span className="text-xs text-muted-foreground">
            {t("notDepartedYet")}
          </span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6">
          <Clock className="size-10 text-primary/40" />
          <p className="text-sm font-medium text-center">{t("notDeparted")}</p>
          <p className="text-xs text-muted-foreground text-center max-w-xs">
            {t("notDepartedBody")}
          </p>
        </div>
      </div>
    );
  }

  // ── Arrived / Cancelled ─────────────────────────────────────────────
  if (data.status === "ARRIVED" || data.status === "CANCELLED") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 px-4 py-2 border-b">
          <Link
            href={backHref}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-1.5 text-xs",
            )}
          >
            <ArrowLeft className="size-3.5" />
            {t("backToBookings")}
          </Link>
          <span className="text-xs text-muted-foreground">
            {data.status === "ARRIVED" ? t("arrived") : t("cancelled")}
          </span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6">
          <Navigation className="size-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-center">
            {data.status === "ARRIVED" ? t("arrived") : t("cancelled")}
          </p>
          <p className="text-xs text-muted-foreground text-center max-w-xs">
            {data.status === "ARRIVED" ? t("arrivedBody") : t("cancelledBody")}
          </p>
        </div>
      </div>
    );
  }

  // ── Dead: no GPS in progress ────────────────────────────────────────
  if (data.freshness === "dead") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 px-4 py-2 border-b">
          <Link
            href={backHref}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-1.5 text-xs",
            )}
          >
            <ArrowLeft className="size-3.5" />
            {t("backToBookings")}
          </Link>
          <span className="text-xs text-muted-foreground">
            {t("signalLost")}
          </span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6">
          <SignalLow className="size-10 text-amber-500/60" />
          <p className="text-sm font-medium text-center">{t("signalLost")}</p>
          <p className="text-xs text-muted-foreground text-center max-w-xs">
            {t("signalLostBody")}
          </p>
        </div>
      </div>
    );
  }

  // ── Live map ────────────────────────────────────────────────────────
  const mapStops = data.stops.filter(
    (s) => s.latitude != null && s.longitude != null,
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2 px-4 py-2 border-b">
        <Link
          href={backHref}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "gap-1.5 text-xs",
          )}
        >
          <ArrowLeft className="size-3.5" />
          {t("backToBookings")}
        </Link>
        <div className="flex items-center gap-1.5">
          <Signal
            className={cn(
              "size-3",
              data.freshness === "fresh"
                ? "text-emerald-500"
                : "text-amber-500",
            )}
          />
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {data.lastPingAt
              ? new Date(data.lastPingAt).toLocaleTimeString()
              : "—"}
          </span>
          {data.lastSpeedKmh != null && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {Math.round(data.lastSpeedKmh)} km/h
              </span>
            </>
          )}
        </div>
      </div>

      {/* Stale warning */}
      {data.freshness === "stale" && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2">
          <span className="text-[11px] text-amber-700 font-medium">
            {t("staleWarning")}
          </span>
        </div>
      )}

      {/* Map */}
      <div className="flex-1 min-h-0">
        <TrackingLiveMap
          busLocation={
            data.lastLatitude != null && data.lastLongitude != null
              ? { latitude: data.lastLatitude, longitude: data.lastLongitude }
              : null
          }
          stops={mapStops}
          boardingStopOrder={data.boardingStopOrder}
          dropoffStopOrder={data.dropoffStopOrder}
        />
      </div>

      {/* Bottom info */}
      <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
        {data.distanceToDropoffKm != null && (
          <div className="flex items-center gap-1">
            <MapPin className="size-3" />
            <span className="tabular-nums">{data.distanceToDropoffKm} km</span>
            <span className="text-[9px] text-muted-foreground/60">approx</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          {data.boardingStopOrder != null && (
            <div className="flex items-center gap-1">
              <div className="size-2 rounded-full bg-emerald-500" />
              <span>
                {t("boarding")} #{data.boardingStopOrder}
              </span>
            </div>
          )}
          {data.dropoffStopOrder != null && (
            <div className="flex items-center gap-1">
              <div className="size-2 rounded-full bg-primary" />
              <span>
                {t("dropoff")} #{data.dropoffStopOrder}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
