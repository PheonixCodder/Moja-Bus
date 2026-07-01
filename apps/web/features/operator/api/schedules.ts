const API_BASE = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";

function getHeaders(): HeadersInit {
  return { "Content-Type": "application/json" };
}

// ──────────────────────────────────────────────
// Types — mirroring the Prisma schema field names
// ──────────────────────────────────────────────

export interface ServiceCalendar {
  id: string;
  scheduleId: string;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  validFrom: string; // ISO date string
  validUntil: string | null;
}

export interface Fare {
  id: string;
  scheduleId: string;
  type: string;
  seatClass: string;
  fromStopOrder: number;
  toStopOrder: number;
  priceXOF: number;
  isActive: boolean;
}

export interface ScheduleRoute {
  id: string;
  name: string;
  originTerminal: {
    id: string;
    name: string;
    city: string;
    cityRelation?: { name: string };
  };
  destTerminal: {
    id: string;
    name: string;
    city: string;
    cityRelation?: { name: string };
  };
  estimatedDurationMin: number | null;
}

export interface Schedule {
  id: string;
  name: string | null;
  companyId: string;
  routeId: string;
  route: ScheduleRoute;
  departureTime: string; // "HH:MM"
  isActive: boolean;
  calendar?: ServiceCalendar;
  fares?: Fare[];
  _count?: {
    trips: number;
    fares: number;
  };
}

export interface CreateSchedulePayload {
  name?: string;
  routeId: string;
  defaultBusId: string;
  departureTime: string; // "HH:MM"
  calendar: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
    validFrom: string; // ISO date string "YYYY-MM-DD"
    validUntil?: string;
  };
  fares: {
    type: "FIXED";
    seatClass: "ECONOMY";
    fromStopOrder: number;
    toStopOrder: number;
    priceXOF: number;
  }[];
}

// ──────────────────────────────────────────────
// Fetch helpers
// ──────────────────────────────────────────────

export async function getSchedules(): Promise<Schedule[]> {
  const res = await fetch(`${API_BASE}/api/v1/schedules`, {
    headers: getHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch schedules");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function getScheduleDetail(id: string): Promise<Schedule> {
  const res = await fetch(`${API_BASE}/api/v1/schedules/${id}`, {
    headers: getHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch schedule details");
  return res.json();
}

export async function createSchedule(
  payload: CreateSchedulePayload,
): Promise<Schedule & { _count: { trips: number } }> {
  const res = await fetch(`${API_BASE}/api/v1/schedules`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error ?? data.message ?? "Failed to create schedule");
  return data;
}

export async function deleteSchedule(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/schedules/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error ?? data.message ?? "Failed to delete schedule");
}

export async function updateSchedule(
  id: string,
  payload: { name?: string | null; departureTime?: string; isActive?: boolean },
): Promise<Schedule> {
  const res = await fetch(`${API_BASE}/api/v1/schedules/${id}`, {
    method: "PATCH",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error ?? data.message ?? "Failed to update schedule");
  return data;
}

export async function updateScheduleCalendar(
  id: string,
  payload: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
    validFrom: string;
    validUntil: string | null;
  },
): Promise<ServiceCalendar> {
  const res = await fetch(`${API_BASE}/api/v1/schedules/${id}/calendar`, {
    method: "PATCH",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error ?? data.message ?? "Failed to update calendar");
  return data;
}

export async function updateFare(
  scheduleId: string,
  fareId: string,
  payload: { priceXOF?: number; type?: string; isActive?: boolean },
): Promise<Fare> {
  const res = await fetch(
    `${API_BASE}/api/v1/schedules/${scheduleId}/fares/${fareId}`,
    {
      method: "PATCH",
      headers: getHeaders(),
      credentials: "include",
      body: JSON.stringify(payload),
    },
  );
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error ?? data.message ?? "Failed to update fare");
  return data;
}

export async function regenerateTrips(
  id: string,
): Promise<{ success: boolean; tripsCreated: number; message: string }> {
  const res = await fetch(`${API_BASE}/api/v1/schedules/${id}/regenerate`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error ?? data.message ?? "Failed to extend trips");
  return data;
}
