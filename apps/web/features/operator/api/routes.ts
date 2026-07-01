const API_BASE = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";

function getHeaders(): HeadersInit {
  return { "Content-Type": "application/json" };
}

// ──────────────────────────────────────────────
// Types — mirroring the Prisma schema field names
// ──────────────────────────────────────────────

export interface City {
  id: string;
  name: string;
  country: string;
  isActive: boolean;
}

export interface Terminal {
  id: string;
  name: string;
  address: string | null;
  city: string;
  latitude: number | null;
  longitude: number | null;
  isTerminal: boolean;
  isPrimary: boolean;
  isActive: boolean;
  cityRelation?: City;
}

export interface RouteWaypoint {
  id: string;
  routeId: string;
  terminalId: string;
  terminal: Terminal;
  stopOrder: number;
  arrivalOffsetMinutes: number;
  departureOffsetMinutes: number;
  isPickup: boolean;
  isDropoff: boolean;
}

export interface Route {
  id: string;
  name: string;
  companyId: string;
  originTerminalId: string;
  originTerminal: Terminal;
  destTerminalId: string;
  destTerminal: Terminal;
  distanceKm: number | null;
  estimatedMinutes: number | null;
  status: string;
  isActive?: boolean;
  waypoints?: RouteWaypoint[];
  _count?: { waypoints: number };
}

export interface CreateRoutePayload {
  name: string;
  originTerminalId: string;
  destTerminalId: string;
  distanceKm?: number;
  estimatedDurationMin?: number;
  waypoints?: {
    terminalId: string;
    stopOrder: number;
    offsetMinutes: number;
    allowPickup?: boolean;
    allowDropoff?: boolean;
  }[];
}

export type UpdateRoutePayload = Partial<CreateRoutePayload> & {
  isActive?: boolean;
};

// ──────────────────────────────────────────────
// Fetch helpers
// ──────────────────────────────────────────────

export async function getRoutes(): Promise<Route[]> {
  const res = await fetch(`${API_BASE}/api/v1/routes`, {
    headers: getHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch routes");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function getRouteDetail(id: string): Promise<Route> {
  const res = await fetch(`${API_BASE}/api/v1/routes/${id}`, {
    headers: getHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch route details");
  return res.json();
}

export async function getTerminals(): Promise<Terminal[]> {
  const res = await fetch(`${API_BASE}/api/v1/routes/terminals`, {
    headers: getHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch terminals");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function getCities(): Promise<City[]> {
  const res = await fetch(`${API_BASE}/api/v1/routes/cities`, {
    headers: getHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch cities");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function createRoute(payload: CreateRoutePayload): Promise<Route> {
  const res = await fetch(`${API_BASE}/api/v1/routes`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error ?? data.message ?? "Failed to create route");
  return data;
}

export async function updateRoute(
  id: string,
  payload: UpdateRoutePayload,
): Promise<Route> {
  const res = await fetch(`${API_BASE}/api/v1/routes/${id}`, {
    method: "PATCH",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error ?? data.message ?? "Failed to update route");
  return data;
}

export async function deleteRoute(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/routes/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error ?? data.message ?? "Failed to delete route");
}
