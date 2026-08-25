import React, { useRef, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import MapboxGL from "@rnmapbox/maps";
import { Navigation, MapPin } from "lucide-react-native";
import { MAPBOX_PUBLIC_TOKEN } from "@/lib/mapbox";

// Initialize Mapbox token
MapboxGL.setAccessToken(MAPBOX_PUBLIC_TOKEN);

export interface NavigationStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  order: number;
  isTerminal?: boolean;
}

interface DriverNavigationMapProps {
  currentLocation?: {
    latitude: number;
    longitude: number;
    heading?: number;
    speedKmh?: number;
  };
  routeGeoJson?: GeoJSON.FeatureCollection<GeoJSON.LineString> | null;
  stops?: NavigationStop[];
  isNavigating?: boolean;
}

export function DriverNavigationMap({
  currentLocation,
  routeGeoJson,
  stops = [],
  isNavigating = true,
}: DriverNavigationMapProps) {
  const cameraRef = useRef<MapboxGL.Camera>(null);

  // Auto-follow user location with course heading
  useEffect(() => {
    if (isNavigating && currentLocation && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [currentLocation.longitude, currentLocation.latitude],
        zoomLevel: 15.5,
        pitch: 45,
        heading: currentLocation.heading || 0,
        animationDuration: 1000,
        animationMode: "flyTo",
      });
    }
  }, [currentLocation, isNavigating]);

  const handleRecenter = () => {
    if (currentLocation && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [currentLocation.longitude, currentLocation.latitude],
        zoomLevel: 16,
        pitch: 45,
        heading: currentLocation.heading || 0,
        animationDuration: 800,
        animationMode: "flyTo",
      });
    }
  };

  const defaultCoordinate = currentLocation
    ? [currentLocation.longitude, currentLocation.latitude]
    : [-4.0083, 5.3599]; // Abidjan, Côte d'Ivoire default

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL="mapbox://styles/mapbox/dark-v11"
        // Phase 30 (F-TM-16) — Mapbox ToS require the logo + attribution
        // notice on hosted styles; hiding them is a store-review and account
        // risk. Both render compact in their default corner.
        compassEnabled={true}
        compassPosition={{ top: 16, right: 16 }}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: defaultCoordinate,
            zoomLevel: 13,
          }}
        />

        {/* Route Polyline Layer */}
        {routeGeoJson && (
          <MapboxGL.ShapeSource id="driverRouteSource" shape={routeGeoJson}>
            <MapboxGL.LineLayer
              id="driverRouteLineCasing"
              style={{
                lineColor: "#9f1239",
                lineWidth: 8,
                lineCap: "round",
                lineJoin: "round",
                lineOpacity: 0.6,
              }}
            />
            <MapboxGL.LineLayer
              id="driverRouteLine"
              style={{
                lineColor: "#e11d48",
                lineWidth: 5,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </MapboxGL.ShapeSource>
        )}

        {/* Stop Waypoint Markers */}
        {stops.map((stop) => (
          <MapboxGL.PointAnnotation
            key={stop.id}
            id={`stop-${stop.id}`}
            coordinate={[stop.longitude, stop.latitude]}
          >
            <View style={stop.isTerminal ? styles.terminalMarker : styles.waypointMarker}>
              <MapPin size={stop.isTerminal ? 14 : 10} color="#ffffff" />
            </View>
          </MapboxGL.PointAnnotation>
        ))}

        {/* Real-time Moving Bus Puck */}
        {currentLocation && (
          <MapboxGL.PointAnnotation
            id="driverBusPuck"
            coordinate={[currentLocation.longitude, currentLocation.latitude]}
          >
            <View style={styles.puckContainer}>
              <View
                style={[
                  styles.puckBody,
                  {
                    transform: [{ rotate: `${currentLocation.heading || 0}deg` }],
                  },
                ]}
              >
                {/* Heading directional pointer */}
                <View style={styles.puckPointer} />
              </View>
            </View>
          </MapboxGL.PointAnnotation>
        )}
      </MapboxGL.MapView>

      {/* Recenter Action Button */}
      <TouchableOpacity
        onPress={handleRecenter}
        style={styles.recenterButton}
        activeOpacity={0.8}
      >
        <Navigation size={20} color="#ffffff" />
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
  terminalMarker: {
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
  waypointMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#38bdf8",
    borderWidth: 2,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  puckContainer: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  puckBody: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e11d48",
    borderWidth: 3,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#e11d48",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  puckPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 10,
    borderStyle: "solid",
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#ffffff",
    marginTop: -4,
  },
  recenterButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});
