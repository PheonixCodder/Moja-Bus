export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface VehicleLocationUpdate {
  vehicleId: string;
  tripId?: string;
  location: GeoPoint;
  headingDegrees?: number;
  speedKph?: number;
  recordedAt: string;
}
