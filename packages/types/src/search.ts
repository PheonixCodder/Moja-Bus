export type Amenity = "AC" | "WIFI" | "TOILET" | "USB" | "LUGGAGE" | "VIP";

export interface SearchOffer {
  offerId: string; // Composite ID: `${tripId}_${originTripStopId}_${destinationTripStopId}`
  tripId: string;

  // Operator Info (Flattened)
  companyId: string;
  companyName: string;
  companyLogoUrl: string | null;
  companyRating: number | null;

  // Journey Segment Info
  originTerminalId: string;
  originTerminalName: string;
  originCityName: string;
  destinationTerminalId: string;
  destinationTerminalName: string;
  destinationCityName: string;

  // Timeline (raw Date objects, formatting done by client)
  departureTime: Date;
  arrivalTime: Date;
  durationMinutes: number;
  stopCount: number; // Number of stops between origin and destination
  isExpress: boolean; // true if 0 stops

  // Pricing
  priceXOF: number;

  // Vehicle Details
  busId: string;
  busTypeName: string;
  amenities: Amenity[];

  // Rich Segment-Specific Availability
  availability: {
    remaining: number;
    occupied: number;
    total: number;
    status: "AVAILABLE" | "FEW_LEFT" | "SOLD_OUT";
  };
}

export interface SearchResponse {
  offers: SearchOffer[];
  total: number;
  hasNextPage: boolean;
  nextCursor: string | null;
}
