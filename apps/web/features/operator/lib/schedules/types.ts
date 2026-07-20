import type { RouterOutputs } from "@/trpc/client";
import { getCalendarDateKey } from "@/lib/timezone";

export type ScheduleListItem =
  RouterOutputs["schedules"]["list"]["items"][number];
export type ScheduleDetail = RouterOutputs["schedules"]["get"];
export type RouteListItem = RouterOutputs["routes"]["list"][number];
export type RouteDetail = RouterOutputs["routes"]["get"];
export type BusListItem = RouterOutputs["fleet"]["getBuses"]["buses"][number];

export type StopLabel = {
  order: number;
  name: string;
  city: string;
};

export type FareDraft = {
  fromStopOrder: number;
  toStopOrder: number;
  priceXOF: number;
  type: "FIXED" | "PROMO" | "HOLIDAY_SURGE" | "EARLY_BIRD";
  seatClass: "ECONOMY" | "STANDARD" | "VIP";
};

export type CalendarConfig = {
  days: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  departureTime: string;
  validFrom: string;
  validUntil: string;
  preferredBusId: string;
};

export const WIZARD_STEPS = ["Route", "Calendar", "Pricing", "Preview"] as const;
export type WizardStep = (typeof WIZARD_STEPS)[number];

export function buildStopsFromRoute(route: RouteDetail): StopLabel[] {
  const origin: StopLabel = {
    order: 0,
    name: route.originTerminal?.name ?? "Origin",
    city:
      route.originTerminal?.cityRelation?.name ??
      route.originTerminal?.city ??
      "",
  };

  const intermediate = (route.waypoints ?? [])
    .slice()
    .sort((a, b) => a.stopOrder - b.stopOrder)
    .map((w) => ({
      order: w.stopOrder,
      name: w.terminal?.name ?? "Stop",
      city: w.terminal?.cityRelation?.name ?? w.terminal?.city ?? "",
    }));

  const lastWp =
    intermediate.length > 0
      ? intermediate[intermediate.length - 1]!.order
      : 0;
  const destination: StopLabel = {
    order: lastWp + 1,
    name: route.destTerminal?.name ?? "Destination",
    city:
      route.destTerminal?.cityRelation?.name ?? route.destTerminal?.city ?? "",
  };

  return [origin, ...intermediate, destination];
}

export function hasRequiredFullRouteFare(
  fares: FareDraft[],
  stops: StopLabel[],
): boolean {
  if (stops.length < 2) return false;
  const last = stops[stops.length - 1]!.order;
  return fares.some(
    (f) => f.fromStopOrder === 0 && f.toStopOrder === last && f.priceXOF > 0,
  );
}

export const defaultCalendarConfig = (): CalendarConfig => ({
  days: {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  },
  departureTime: "08:00",
  // M26: derive the default from the Abidjan app calendar day, not UTC
  // `toISOString()`, so operators outside West Africa don't get yesterday's
  // date as the schedule's valid-from default.
  validFrom: getCalendarDateKey(new Date()),
  validUntil: "",
  preferredBusId: "",
});
