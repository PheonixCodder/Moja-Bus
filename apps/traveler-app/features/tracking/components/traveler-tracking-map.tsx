import React, { useRef, useEffect, useState } from "react";
import { View, Pressable } from "react-native";
import MapboxGL from "@rnmapbox/maps";
import { Bus, MapPin, Navigation } from "lucide-react-native";
import { Palette } from "@/constants/theme";
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
    <View className="flex-1 bg-background relative">
      <MapboxGL.MapView
        className="flex-1"
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
                lineColor: Palette.rose[700],
                lineWidth: 7,
                lineCap: "round",
                lineJoin: "round",
                lineOpacity: 0.5,
              }}
            />
            <MapboxGL.LineLayer
              id="travelerRouteLine"
              style={{
                lineColor: Palette.rose[500],
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
            <View className="size-7 rounded-full bg-success border-2 border-white items-center justify-center shadow-lg">
              <MapPin size={14} color={Palette.zinc[50]} />
            </View>
          </MapboxGL.PointAnnotation>
        )}

        {/* Destination Terminal Pin */}
        {destinationTerminal && (
          <MapboxGL.PointAnnotation
            id="destPin"
            coordinate={[destinationTerminal.longitude, destinationTerminal.latitude]}
          >
            <View className="size-7 rounded-full bg-primary border-2 border-white items-center justify-center shadow-lg">
              <MapPin size={14} color={Palette.zinc[50]} />
            </View>
          </MapboxGL.PointAnnotation>
        )}

        {/* Live Moving Bus Marker */}
        <MapboxGL.PointAnnotation
          id="liveBusMarker"
          coordinate={smoothedCoord}
        >
          <View className="size-[52px] items-center justify-center">
            <View className="absolute size-12 rounded-full bg-primary/25 border border-primary/50" />
            <View
              className="size-9 rounded-full bg-primary border-2 border-white items-center justify-center shadow-lg"
              style={{
                transform: [{ rotate: `${busLocation.heading || 0}deg` }],
              }}
            >
              <Bus size={18} color={Palette.zinc[50]} />
            </View>
          </View>
        </MapboxGL.PointAnnotation>
      </MapboxGL.MapView>

      {/* Recenter Button */}
      <Pressable
        onPress={handleRecenter}
        accessibilityRole="button"
        accessibilityLabel="Recenter map"
        className="absolute bottom-3 right-3 size-11 rounded-full bg-card border border-border items-center justify-center shadow-lg active:opacity-80"
      >
        <Navigation size={18} color={Palette.zinc[50]} />
      </Pressable>
    </View>
  );
}
