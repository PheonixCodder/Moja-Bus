import React, { useRef, useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import MapboxGL from "@rnmapbox/maps";
import { Bus, MapPin, Navigation } from "lucide-react-native";
import { MAPBOX_PUBLIC_TOKEN } from "@/lib/mapbox";

MapboxGL.setAccessToken(MAPBOX_PUBLIC_TOKEN);

export interface TrackingTerminal {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  isDestination?: boolean;
}

interface TravelerTrackingMapProps {
  busLocation: {
    latitude: number;
    longitude: number;
    heading?: number;
    speedKmh?: number;
  };
  destinationTerminal?: TrackingTerminal;
  originTerminal?: TrackingTerminal;
  routeGeoJson?: GeoJSON.FeatureCollection<GeoJSON.LineString> | null;
}

export function TravelerTrackingMap({
  busLocation,
  destinationTerminal,
  originTerminal,
  routeGeoJson,
}: TravelerTrackingMapProps) {
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const [smoothedCoord, setSmoothedCoord] = useState([
    busLocation.longitude,
    busLocation.latitude,
  ]);

  // Smooth Coordinate Interpolation for Vehicle Marker
  useEffect(() => {
    setSmoothedCoord([busLocation.longitude, busLocation.latitude]);
  }, [busLocation.latitude, busLocation.longitude]);

  // Dynamic Camera Framing
  useEffect(() => {
    if (cameraRef.current) {
      if (destinationTerminal) {
        cameraRef.current.fitBounds(
          [destinationTerminal.longitude, destinationTerminal.latitude],
          [busLocation.longitude, busLocation.latitude],
          80, // 80px padding
          1000 // 1s animation
        );
      } else {
        cameraRef.current.setCamera({
          centerCoordinate: [busLocation.longitude, busLocation.latitude],
          zoomLevel: 14,
          animationDuration: 1000,
          animationMode: "flyTo",
        });
      }
    }
  }, [busLocation.latitude, busLocation.longitude, destinationTerminal]);

  const handleRecenter = () => {
    if (cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [busLocation.longitude, busLocation.latitude],
        zoomLevel: 15,
        animationDuration: 800,
        animationMode: "flyTo",
      });
    }
  };

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL="mapbox://styles/mapbox/dark-v11"
        // Phase 30 (F-TM-16) — Mapbox ToS require the logo + attribution
        // notice on hosted styles; hiding them is a store-review and account
        // risk. Both render compact in their default corner.
        compassEnabled={true}
        compassPosition={{ top: 12, right: 12 }}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [busLocation.longitude, busLocation.latitude],
            zoomLevel: 13,
          }}
        />

        {/* Route Polyline Layer */}
        {routeGeoJson && (
          <MapboxGL.ShapeSource id="travelerRouteSource" shape={routeGeoJson}>
            <MapboxGL.LineLayer
              id="travelerRouteLineCasing"
              style={{
                lineColor: "#9f1239",
                lineWidth: 7,
                lineCap: "round",
                lineJoin: "round",
                lineOpacity: 0.5,
              }}
            />
            <MapboxGL.LineLayer
              id="travelerRouteLine"
              style={{
                lineColor: "#e11d48",
                lineWidth: 4,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </MapboxGL.ShapeSource>
        )}

        {/* Origin Terminal Pin */}
        {originTerminal && (
          <MapboxGL.PointAnnotation
            id="originPin"
            coordinate={[originTerminal.longitude, originTerminal.latitude]}
          >
            <View style={styles.originMarker}>
              <MapPin size={14} color="#ffffff" />
            </View>
          </MapboxGL.PointAnnotation>
        )}

        {/* Destination Terminal Pin */}
        {destinationTerminal && (
          <MapboxGL.PointAnnotation
            id="destPin"
            coordinate={[destinationTerminal.longitude, destinationTerminal.latitude]}
          >
            <View style={styles.destMarker}>
              <MapPin size={14} color="#ffffff" />
            </View>
          </MapboxGL.PointAnnotation>
        )}

        {/* Live Moving Bus Marker */}
        <MapboxGL.PointAnnotation
          id="liveBusMarker"
          coordinate={smoothedCoord}
        >
          <View style={styles.busMarkerContainer}>
            <View style={styles.busPulseRing} />
            <View
              style={[
                styles.busIconBody,
                {
                  transform: [{ rotate: `${busLocation.heading || 0}deg` }],
                },
              ]}
            >
              <Bus size={18} color="#ffffff" />
            </View>
          </View>
        </MapboxGL.PointAnnotation>
      </MapboxGL.MapView>

      {/* Recenter Button */}
      <TouchableOpacity
        onPress={handleRecenter}
        style={styles.recenterButton}
        activeOpacity={0.8}
      >
        <Navigation size={18} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#09090b",
    position: "relative",
  },
  map: {
    flex: 1,
  },
  originMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#10b981",
    borderWidth: 2,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  destMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e11d48",
    borderWidth: 2,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#e11d48",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  busMarkerContainer: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  busPulseRing: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(225, 29, 72, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(225, 29, 72, 0.5)",
  },
  busIconBody: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e11d48",
    borderWidth: 2.5,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#e11d48",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  recenterButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
});
