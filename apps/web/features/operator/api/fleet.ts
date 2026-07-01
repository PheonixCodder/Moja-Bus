const API_BASE = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";

function getHeaders(): HeadersInit {
  return { "Content-Type": "application/json" };
}

// ──────────────────────────────────────────────
// Types — mirroring the Prisma schema field names
// ──────────────────────────────────────────────

export interface BusType {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface SeatLayoutTemplate {
  id: string;
  name: string;
  totalSeats: number;
  rows: number;
  columns: number;
  hasAC: boolean;
  hasWifi: boolean;
  hasToilet: boolean;
  hasLuggage: boolean;
  busTypeId: string;
  busType?: BusType;
}

export interface Seat {
  id: string;
  row: number;
  col: number; // API uses "col" not "column"
  deck: number;
  label: string;
  seatType:
    | "PASSENGER_WINDOW"
    | "PASSENGER_AISLE"
    | "DRIVER_AREA"
    | "EMPTY_SPACE";
  isActive: boolean;
}

export interface Bus {
  id: string;
  registrationPlate: string; // API uses "registrationPlate" not "plateNumber"
  internalName: string | null;
  manufactureYear: number | null;
  notes: string | null;
  status: "ACTIVE" | "MAINTENANCE" | "INACTIVE";
  busTypeId: string;
  busType: BusType;
  layoutTemplateId: string;
  layoutTemplate: SeatLayoutTemplate;
  seats?: Seat[];
  _count?: { seats: number };
}

export interface FleetStats {
  total: number;
  active: number;
  maintenance: number;
  inactive: number;
  totalSeats: number;
}

// ──────────────────────────────────────────────
// Fetch helpers
// ──────────────────────────────────────────────

export async function getBusTypes(): Promise<BusType[]> {
  const res = await fetch(`${API_BASE}/api/v1/fleet/bus-types`, {
    headers: getHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch bus types");
  const data = await res.json();
  // API returns raw array
  return Array.isArray(data) ? data : [];
}

export async function getLayoutTemplates(): Promise<SeatLayoutTemplate[]> {
  const res = await fetch(`${API_BASE}/api/v1/fleet/layouts`, {
    headers: getHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch layout templates");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function getBuses(): Promise<{ buses: Bus[]; stats: FleetStats }> {
  const res = await fetch(`${API_BASE}/api/v1/fleet/buses`, {
    headers: getHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch buses");
  const data = await res.json();
  // API returns a raw array — compute stats client-side
  const buses: Bus[] = Array.isArray(data) ? data : [];
  const stats: FleetStats = {
    total: buses.length,
    active: buses.filter((b) => b.status === "ACTIVE").length,
    maintenance: buses.filter((b) => b.status === "MAINTENANCE").length,
    inactive: buses.filter((b) => b.status === "INACTIVE").length,
    totalSeats: buses.reduce(
      (sum, b) => sum + (b.layoutTemplate?.totalSeats ?? 0),
      0,
    ),
  };
  return { buses, stats };
}

export async function getBusDetails(id: string): Promise<Bus> {
  const res = await fetch(`${API_BASE}/api/v1/fleet/buses/${id}`, {
    headers: getHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch bus details");
  // API returns raw bus object
  return res.json();
}

export async function createBus(payload: {
  registrationPlate: string;
  busTypeId: string;
  layoutTemplateId: string;
  internalName?: string;
  manufactureYear?: number;
  notes?: string;
}): Promise<Bus> {
  const res = await fetch(`${API_BASE}/api/v1/fleet/buses`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error ?? data.message ?? "Failed to create bus");
  return data;
}

export async function updateBus(
  id: string,
  payload: {
    registrationPlate?: string;
    internalName?: string;
    manufactureYear?: number;
    notes?: string;
    status?: "ACTIVE" | "MAINTENANCE" | "INACTIVE";
  },
): Promise<Bus> {
  const res = await fetch(`${API_BASE}/api/v1/fleet/buses/${id}`, {
    method: "PATCH",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error ?? data.message ?? "Failed to update bus");
  return data;
}

export async function deleteBus(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/fleet/buses/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error ?? data.message ?? "Failed to delete bus");
}

export async function toggleSeatStatus(
  busId: string,
  seatId: string,
  isActive: boolean,
): Promise<Seat> {
  const res = await fetch(
    `${API_BASE}/api/v1/fleet/buses/${busId}/seats/${seatId}`,
    {
      method: "PATCH",
      headers: getHeaders(),
      credentials: "include",
      body: JSON.stringify({ isActive }),
    },
  );
  const data = await res.json();
  if (!res.ok)
    throw new Error(
      data.error ?? data.message ?? "Failed to toggle seat status",
    );
  return data;
}
