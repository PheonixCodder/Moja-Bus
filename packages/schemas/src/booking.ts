export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "EXPIRED"
  | "COMPLETED";

export type SeatStatus = "AVAILABLE" | "RESERVED" | "SOLD";

export interface BookingPassenger {
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface BookingSeat {
  seatId: string;
  seatCode: string;
  status: SeatStatus;
}

export interface BookingSummary {
  bookingId: string;
  tripId: string;
  status: BookingStatus;
  currency: "XOF";
  totalAmount: number;
  seatIds: string[];
  passengerCount: number;
}
