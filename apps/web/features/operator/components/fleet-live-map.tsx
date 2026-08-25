"use client";

import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

/**
 * Phase 23 (F-OP-01/F-TM-12) — real fleet map replacing the simulated radar.
 * Data source: the existing 10-second getLivePositions poll (HTTP); when the
 * WS gateway revives this component swaps to push updates under the same
 * props contract.
 *
 * Freshness states (D2): fresh ≤5 min · stale 5 min–24 h (dimmed) · hidden
 * beyond 24 h — a dead coordinate row is not "live fleet".
 */

export interface FleetVehicle {
  id: string;
  fullName: string;
  plate: string | null;
  status: string;
  latitude: number;
  longitude: number;
  heading: number | null;
  speedKmh: number | null;
  lastPingAt: string | Date | null;
}

const FRESH_MS = 5 * 60 * 1000;
const STALE_MS = 24 * 60 * 60 * 1000;

export type VehicleFreshness = "fresh" | "stale";

export function vehicleFreshness(
  lastPingAt: FleetVehicle["lastPingAt"],
  now: number,
): VehicleFreshness | "dead" {
  if (!lastPingAt) return "dead";
  const age = now - new Date(lastPingAt).getTime();
  if (age > STALE_MS) return "dead";
  if (age > FRESH_MS) return "stale";
  return "fresh";
}

// Fix Leaflet default icon paths broken by bundlers (same as route-map-preview)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function vehicleIcon(
  vehicle: FleetVehicle,
  selected: boolean,
  freshness: "fresh" | "stale",
): L.DivIcon {
  const onTrip = vehicle.status === "ON_TRIP";
  const color =
    freshness === "stale" ? "#71717a" : onTrip ? "#e11d48" : "#38bdf8";
  const size = selected ? 22 : freshness === "fresh" ? 16 : 13;
  const ring = selected
    ? "box-shadow: 0 0 0 4px rgba(16,185,129,0.35), 0 1px 6px rgba(0,0,0,0.35);"
    : "box-shadow: 0 1px 4px rgba(0,0,0,0.3);";
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;background:${color};border:2.5px solid #fff;border-radius:50%;${ring}opacity:${freshness === "stale" ? 0.45 : 1};"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

interface FleetLiveMapProps {
  vehicles: FleetVehicle[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  now: number;
}

const ABIDJAN_CENTER: [number, number] = [5.3599, -4.0083];

export default function FleetLiveMap({
  vehicles,
  selectedId,
  onSelect,
  now,
}: FleetLiveMapProps) {
  const plotted = vehicles
    .filter((v) => v.latitude != null && v.longitude != null)
    .map((v) => ({ ...v, freshness: vehicleFreshness(v.lastPingAt, now) }))
    .filter((v) => v.freshness !== "dead");

  return (
    <MapContainer
      center={ABIDJAN_CENTER}
      zoom={12}
      className="size-full z-0"
      preferCanvas
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {plotted.map((v) => (
        <Marker
          key={v.id}
          position={[v.latitude, v.longitude]}
          icon={vehicleIcon(
            v,
            selectedId === v.id,
            v.freshness === "fresh" ? "fresh" : "stale",
          )}
          eventHandlers={{ click: () => onSelect(v.id) }}
        >
          <Popup>
            <div style={{ minWidth: 180 }}>
              <strong>{v.fullName}</strong>
              <br />
              Plate: {v.plate ?? "—"}
              <br />
              Status: {v.status}
              <br />
              Speed:{" "}
              {v.speedKmh != null ? `${Math.round(v.speedKmh)} km/h` : "—"}
              <br />
              Last ping:{" "}
              {v.lastPingAt ? new Date(v.lastPingAt).toLocaleTimeString() : "—"}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
