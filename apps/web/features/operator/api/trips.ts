const API_BASE = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";

function getHeaders(): HeadersInit {
  return { "Content-Type": "application/json" };
}

// ──────────────────────────────────────────────
// Types — mirroring the Prisma schema field names
// ──────────────────────────────────────────────

export type TripStatus =
  | "SCHEDULED"
  | "BOARDING"
  | "DEPARTED"
  | "DELAYED"
  | "CANCELLED"
  | "COMPLETED";

export interface TripBus {
  id: string;
  registrationPlate: string;
  internalName: string | null;
  busType: { id: string; name: string };
}

export interface TripRoute {
  id: string;
  name: string;
  originTerminal: {
    id: string;
    name: string;
    city: string;
    cityRelation?: { name: string };
    latitude: number | null;
    longitude: number | null;
  };
  destTerminal: {
    id: string;
    name: string;
    city: string;
    cityRelation?: { name: string };
    latitude: number | null;
    longitude: number | null;
  };
}

export interface TripSchedule {
  id: string;
  departureTime: string;
  route: TripRoute;
}

export interface TripStop {
  id: string;
  stopOrder: number;
  offsetMinutes: number;
  terminal: {
    id: string;
    name: string;
    city: string;
    cityRelation?: { name: string };
  };
}

export interface TripSeat {
  id: string;
  seatId: string;
  status: "AVAILABLE" | "BOOKED" | "BLOCKED";
  seat: {
    id: string;
    label: string;
    row: number;
    col: number;
    deck: number;
    seatType: string;
    isActive: boolean;
  };
}

export interface TripBooking {
  id: string;
  passengerName: string;
  passengerPhone: string | null;
  seatLabel: string;
  status: string;
  checkedIn: boolean;
  fromStopOrder: number;
  toStopOrder: number;
}

export interface Trip {
  id: string;
  companyId: string;
  busId: string | null;
  scheduleId: string;
  status: TripStatus;
  departureDate: string; // ISO date string
  delayMinutes: number;
  cancellationReason: string | null;
  totalSeats: number;
  bookedSeats: number;
  bus?: TripBus | null;
  schedule?: TripSchedule;
  tripStops?: TripStop[];
  seats?: TripSeat[];
  bookings?: TripBooking[];
}

export interface TripFilters {
  status?: TripStatus;
  routeId?: string;
  startDate?: string; // ISO date "YYYY-MM-DD"
  endDate?: string;
}

// ──────────────────────────────────────────────
// Fetch helpers
// ──────────────────────────────────────────────

export async function getTrips(filters?: TripFilters): Promise<Trip[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.routeId) params.set("routeId", filters.routeId);
  if (filters?.startDate) params.set("startDate", filters.startDate);
  if (filters?.endDate) params.set("endDate", filters.endDate);

  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${API_BASE}/api/v1/trips${query}`, {
    headers: getHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch trips");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function getTripDetail(id: string): Promise<Trip> {
  const res = await fetch(`${API_BASE}/api/v1/trips/${id}`, {
    headers: getHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch trip details");
  return res.json();
}

export async function assignBusDriver(
  id: string,
  payload: { busId: string },
): Promise<Trip> {
  const res = await fetch(`${API_BASE}/api/v1/trips/${id}/assign`, {
    method: "PATCH",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(
      data.error ?? data.message ?? "Failed to assign bus/driver",
    );
  return data;
}

export async function logDelay(
  id: string,
  payload: { delayMinutes: number; notes?: string },
): Promise<Trip> {
  const res = await fetch(`${API_BASE}/api/v1/trips/${id}/delay`, {
    method: "PATCH",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error ?? data.message ?? "Failed to log delay");
  return data;
}

export async function cancelTrip(
  id: string,
  payload: { cancelReason: string },
): Promise<Trip> {
  const res = await fetch(`${API_BASE}/api/v1/trips/${id}/cancel`, {
    method: "PATCH",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error ?? data.message ?? "Failed to cancel trip");
  return data;
}

export async function startBoarding(id: string): Promise<Trip> {
  const res = await fetch(`${API_BASE}/api/v1/trips/${id}/status`, {
    method: "PATCH",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify({ status: "BOARDING" }),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error ?? data.message ?? "Failed to start boarding");
  return data;
}
