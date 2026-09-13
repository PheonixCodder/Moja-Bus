export interface TripStopTerminal {
  id: string;
  name: string;
  cityRelation?: { name: string } | null;
  municipality?: { name: string } | null;
  quarter?: { name: string } | null;
}

export interface TripStop {
  id: string;
  terminalId: string;
  stopOrder: number;
  isPickup: boolean;
  isDropoff: boolean;
  scheduledDeparture?: Date | string | null;
  terminal?: TripStopTerminal | null;
}

export interface TripFare {
  id: string;
  priceXOF: number;
  type: string;
}

export interface TripBus {
  id: string;
  registrationPlate?: string | null;
  internalName?: string | null;
  seatClass?: string | null;
}

export interface TripSchedule {
  id: string;
  name: string;
  fares: TripFare[];
}

export interface TodayTrip {
  id: string;
  status: string;
  departureDate: Date | string;
  serviceType: string;
  gate?: string | null;
  totalSeats: number;
  bookedCount: number;
  availableSeats: number;
  schedule?: TripSchedule | null;
  bus?: TripBus | null;
  tripStops: TripStop[];
}

export type DestinationFilter = "ALL" | "IMMINENT" | string;
