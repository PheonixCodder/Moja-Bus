export interface TripSearchInput {
  origin: string;
  destination: string;
  date: string;
  passengers: number;
  boardingStopId?: string;
  alightingStopId?: string;
}

export interface TripSearchResult {
  tripId: string;
  routeId: string;
  operatorId: string;
  departureAt: string;
  arrivalAt: string;
  price: number;
  availableSeats: number;
  rating?: number;
}
