import { Wifi, Wind, Coffee, Briefcase, type LucideIcon } from "lucide-react";

export const AMENITY_OPTIONS: {
  id: "AC" | "WIFI" | "TOILET" | "LUGGAGE";
  label: string;
  icon: LucideIcon;
}[] = [
  { id: "AC", label: "Air Conditioning", icon: Wind },
  { id: "WIFI", label: "Free WiFi", icon: Wifi },
  { id: "TOILET", label: "Onboard Toilet", icon: Coffee },
  { id: "LUGGAGE", label: "Luggage Space", icon: Briefcase },
];

export const DEPARTURE_TIME_OPTIONS = [
  { id: "MORNING", label: "Morning (05:00 - 12:00)" },
  { id: "AFTERNOON", label: "Afternoon (12:00 - 17:00)" },
  { id: "EVENING", label: "Evening (17:00 - 05:00)" },
] as const;

export const SORT_OPTIONS_UI = [
  { id: "BEST", label: "Best" },
  { id: "CHEAPEST", label: "Cheapest" },
  { id: "FASTEST", label: "Fastest" },
  { id: "EARLIEST", label: "Earliest" },
] as const;

export const FALLBACK_OPERATORS = [
  { id: "utb", name: "UTB" },
  { id: "avs", name: "AVS" },
  { id: "stlf", name: "STLF" },
];

export const PRICE_RANGE = { min: 1000, max: 20000, step: 500 };