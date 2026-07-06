import type { Amenity } from "./search";

export type PassengerSeatStatus =
  | "AVAILABLE"
  | "HELD"
  | "SOLD"
  | "BLOCKED"
  | "DRIVER"
  | "EMPTY";

export interface TripDetailsStop {
  id: string;
  stopOrder: number;
  terminalName: string;
  cityName: string;
  scheduledDeparture: Date | null;
  scheduledArrival: Date | null;
  isPickup: boolean;
  isDropoff: boolean;
}

export interface TripDetails {
  offerId: string;
  tripId: string;
  companyId: string;
  companyName: string;
  companyLogoUrl: string | null;
  originTerminalId: string;
  originTerminalName: string;
  originCityName: string;
  destinationTerminalId: string;
  destinationTerminalName: string;
  destinationCityName: string;
  originTripStopId: string;
  destinationTripStopId: string;
  boardingStopOrder: number;
  dropoffStopOrder: number;
  departureTime: Date;
  arrivalTime: Date;
  durationMinutes: number;
  stopCount: number;
  isExpress: boolean;
  priceXOF: number;
  busId: string;
  busTypeName: string;
  amenities: Amenity[];
  tripStatus: string;
  availability: {
    remaining: number;
    occupied: number;
    total: number;
    status: "AVAILABLE" | "FEW_LEFT" | "SOLD_OUT";
  };
  stops: TripDetailsStop[];
}

export interface SeatAvailabilityItem {
  seatId: string;
  tripSeatId: string;
  label: string;
  row: number;
  col: number;
  deck: number;
  seatType: string;
  status: PassengerSeatStatus;
}

export interface SeatAvailability {
  offerId: string;
  rows: number;
  columns: number;
  deck: number;
  priceXOF: number;
  seats: SeatAvailabilityItem[];
}

export interface BookingHoldResult {
  holdId: string;
  holdExpiresAt: Date;
  bookingReferences: string[];
  totalAmountXOF: number;
  subtotalBaseXOF?: number;
  convenienceFeeXOF?: number;
}

export interface ConfirmedBookingResult {
  holdId: string;
  bookingReferences: string[];
  ticketTokens: string[];
  totalAmountXOF: number;
  status: "CONFIRMED";
}

export type PassengerBookingStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "CANCELLED"
  | "EXPIRED"
  | "COMPLETED";

export interface PassengerBookingSeat {
  bookingId: string;
  bookingReference: string;
  seatLabel: string;
  passengerName: string;
  passengerPhone: string;
  farePaidXOF: number;
  ticketToken: string;
}

export interface PassengerBookingSummary {
  groupId: string;
  holdGroupId: string | null;
  tripId: string;
  companyName: string;
  originTerminalName: string;
  originCityName: string;
  destinationTerminalName: string;
  destinationCityName: string;
  departureTime: Date;
  arrivalTime: Date;
  passengerName: string;
  passengerPhone: string;
  status: PassengerBookingStatus;
  paymentStatus: string;
  holdExpiresAt: Date | null;
  issuedAt: Date | null;
  totalAmountXOF: number;
  seats: PassengerBookingSeat[];
  offerId: string;
}

export interface PassengerBookingsListResult {
  items: PassengerBookingSummary[];
  total: number;
}

export type OperatorBookingFilter = "today" | "upcoming" | "past";

export interface OperatorBookingListItem {
  id: string;
  bookingReference: string;
  tripId: string;
  passengerName: string;
  passengerPhone: string;
  seatLabel: string;
  status: PassengerBookingStatus;
  paymentStatus: string;
  checkedInAt: Date | null;
  departureTime: Date;
  originCityName: string;
  destinationCityName: string;
  originTerminalName: string;
  destinationTerminalName: string;
}

export interface OperatorBookingDetail extends OperatorBookingListItem {
  ticketToken: string;
  farePaidXOF: number;
  issuedAt: Date | null;
  boardingStopOrder: number;
  dropoffStopOrder: number;
}

export interface OperatorBookingsListResult {
  items: OperatorBookingListItem[];
  total: number;
}

export interface OperatorCheckInResult {
  success: true;
  alreadyCheckedIn: boolean;
  bookingId: string;
  bookingReference: string;
  passengerName: string;
  seatLabel: string;
  checkedInAt: Date;
}

export interface DigitalTicketDTO {
  bookingReference: string;
  ticketToken: string;
  passengerName: string;
  seatLabel: string;
  companyName: string;
  originTerminalName: string;
  originCityName: string;
  destinationTerminalName: string;
  destinationCityName: string;
  departureTime: Date;
  arrivalTime: Date;
  farePaidXOF: number;
  qrPayload: string;
  status: "CONFIRMED";
}
