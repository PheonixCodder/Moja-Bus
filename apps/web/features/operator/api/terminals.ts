const API_BASE = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";

function getHeaders(): HeadersInit {
  return { "Content-Type": "application/json" };
}

export interface City {
  id: string;
  name: string;
  country: string;
  isActive: boolean;
}

export interface Terminal {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string;
  cityId: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  managerName: string | null;
  managerPhone: string | null;
  managerEmail: string | null;
  isTerminal: boolean;
  isPrimary: boolean;
  isActive: boolean;
  cityRelation?: City;
}

export interface CreateTerminalPayload {
  name: string;
  addressLine1: string;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string;
  cityId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone: string;
  managerName?: string | null;
  managerPhone?: string | null;
  managerEmail?: string | null;
  isTerminal?: boolean;
  isPrimary?: boolean;
  isActive?: boolean;
}

export type UpdateTerminalPayload = Partial<CreateTerminalPayload>;

export async function getLocations(): Promise<Terminal[]> {
  const res = await fetch(`${API_BASE}/api/v1/terminals`, {
    headers: getHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch locations");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function createTerminal(
  payload: CreateTerminalPayload,
): Promise<Terminal> {
  const res = await fetch(`${API_BASE}/api/v1/terminals`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error ?? data.message ?? "Failed to create terminal");
  return data;
}

export async function updateTerminal(
  id: string,
  payload: UpdateTerminalPayload,
): Promise<Terminal> {
  const res = await fetch(`${API_BASE}/api/v1/terminals/${id}`, {
    method: "PATCH",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error ?? data.message ?? "Failed to update terminal");
  return data;
}

export async function deleteTerminal(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/terminals/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error ?? data.message ?? "Failed to delete terminal");
}
