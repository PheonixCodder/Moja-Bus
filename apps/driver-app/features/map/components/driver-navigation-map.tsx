import React, { useRef, useEffect } from "react";
import { View, StyleSheet, Text } from "react-native";
import MapboxGL from "@rnmapbox/maps";
import { Navigation, MapPin } from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { Palette } from "@moja/theme/tokens";
import { colors } from "@/constants/theme";
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
                lineColor: Palette.rose[900],
                lineWidth: 8,
                lineCap: "round",
                lineJoin: "round",
                lineOpacity: 0.6,
              }}
            />
            <MapboxGL.LineLayer
              id="driverRouteLine"
              style={{
                lineColor: Palette.rose[600],
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
              <MapPin size={stop.isTerminal ? 14 : 10} color={Palette.zinc[50]} />
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
      <Button
        onPress={handleRecenter}
        variant="secondary"
        size="sm"
        className="absolute bottom-4 right-4 w-11 h-11 p-0 rounded-full border border-border items-center justify-center shadow-lg"
      >
        <Navigation size={20} color={colors.neutral.textPrimary} />
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  terminalMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.emerald[500],
    borderWidth: 2,
    borderColor: Palette.zinc[50],
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  waypointMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Palette.blue[500],
    borderWidth: 2,
    borderColor: Palette.zinc[50],
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
    backgroundColor: Palette.rose[600],
    borderWidth: 3,
    borderColor: Palette.zinc[50],
    alignItems: "center",
    justifyContent: "center",
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
    borderBottomColor: Palette.zinc[50],
    marginTop: -4,
  },
});
