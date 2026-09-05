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
import { useTranslations } from "next-intl";

// Minimal shape accepted by the shared route map. Both the operator route
// editors and the passenger booking surfaces map their own data into this.
export interface RouteMapPoint {
  id: string;
  name: string;
  cityName: string;
  latitude: number;
  longitude: number;
}

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
      background: ${isEndpoint ? "var(--primary)" : "var(--secondary-foreground)"};
      border: 2.5px solid var(--background);
      border-radius: 50%;
      box-shadow: 0 1px 4px rgba(0,0,0,0.25);
    "></div>`,
    iconSize: [isEndpoint ? 14 : 10, isEndpoint ? 14 : 10],
    iconAnchor: [isEndpoint ? 7 : 5, isEndpoint ? 7 : 5],
  });
}

interface RouteMapPreviewProps {
  points: RouteMapPoint[];
}

export default function RouteMapPreview({ points }: RouteMapPreviewProps) {
  const t = useTranslations("operatorDashboard.routes.mapPreview");
  const validPoints = points.filter(
    (p) => p.latitude != null && p.longitude != null,
  );

  if (validPoints.length === 0) {
    return (
      <div className="h-full w-full bg-muted flex flex-col items-center justify-center gap-2 p-4">
        <p className="text-xs text-center text-muted-foreground leading-relaxed">
          {t("unavailable")}
        </p>
      </div>
    );
  }

  // Center map on midpoint of all points
  const lats = validPoints.map((p) => p.latitude);
  const lngs = validPoints.map((p) => p.longitude);
  const center: [number, number] = [
    (Math.min(...lats) + Math.max(...lats)) / 2,
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
  ];

  // Polyline positions — straight line between all stops in order
  const polyline: [number, number][] = validPoints.map((p) => [
    p.latitude,
    p.longitude,
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
        /* Phase 30 (F-TM-16): ODbL requires visible attribution — the OSM
         string below only renders when the control is enabled. */
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
              color: "var(--primary)",
              weight: 2.5,
              opacity: 0.75,
              dashArray: "6 4",
            }}
          />
        )}

        {/* Stop markers */}
        {validPoints.map((p, i) => {
          const isEndpoint = i === 0 || i === validPoints.length - 1;
          return (
            <Marker
              key={p.id}
              position={[p.latitude, p.longitude]}
              icon={createBrandedIcon(isEndpoint)}
            >
              <Popup className="text-xs">
                <strong>{p.name}</strong>
                <br />
                {p.cityName}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </>
  );
}
