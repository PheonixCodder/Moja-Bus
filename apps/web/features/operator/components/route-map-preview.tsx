"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import type { RouterOutputs } from "@/trpc/client";

type Terminal = RouterOutputs["terminals"]["list"][number];

// Fix Leaflet default icon paths broken by webpack/turbopack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Primary branded marker
function createBrandedIcon(isEndpoint: boolean) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width: ${isEndpoint ? "14px" : "10px"};
      height: ${isEndpoint ? "14px" : "10px"};
      background: ${isEndpoint ? "#ee237c" : "#9333ea"};
      border: 2.5px solid #fff;
      border-radius: 50%;
      box-shadow: 0 1px 4px rgba(0,0,0,0.25);
    "></div>`,
    iconSize: [isEndpoint ? 14 : 10, isEndpoint ? 14 : 10],
    iconAnchor: [isEndpoint ? 7 : 5, isEndpoint ? 7 : 5],
  });
}

interface RouteMapPreviewProps {
  terminals: Terminal[];
}

export default function RouteMapPreview({ terminals }: RouteMapPreviewProps) {
  const validTerminals = terminals.filter(
    (t) => t.latitude != null && t.longitude != null,
  );

  if (validTerminals.length === 0) {
    return (
      <div className="h-full w-full bg-slate-100 flex flex-col items-center justify-center gap-2 p-4">
        <p className="text-xs text-center text-slate-400 leading-relaxed">
          Terminal coordinates will appear here once origin and destination are
          selected.
        </p>
      </div>
    );
  }

  // Center map on midpoint of all terminals
  const lats = validTerminals.map((t) => t.latitude!);
  const lngs = validTerminals.map((t) => t.longitude!);
  const center: [number, number] = [
    (Math.min(...lats) + Math.max(...lats)) / 2,
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
  ];

  // Polyline positions — straight line between all stops in order
  const polyline: [number, number][] = validTerminals.map((t) => [
    t.latitude!,
    t.longitude!,
  ]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <MapContainer
        center={center}
      zoom={7}
      style={{ height: "100%", width: "100%" }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      {/* Route polyline */}
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

      {/* Terminal markers */}
      {validTerminals.map((t, i) => {
        const isEndpoint = i === 0 || i === validTerminals.length - 1;
        return (
          <Marker
            key={t.id}
            position={[t.latitude!, t.longitude!]}
            icon={createBrandedIcon(isEndpoint)}
          >
            <Popup className="text-xs">
              <strong>{t.name}</strong>
              <br />
              {t.cityRelation?.name ?? t.city}
            </Popup>
          </Marker>
        );
      })}
      </MapContainer>
    </>
  );
}
