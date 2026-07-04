import { Briefcase, Coffee, Wifi, Wind, type LucideIcon } from "lucide-react";
import type { Amenity } from "@moja/types";

export const AMENITY_ICON: Partial<Record<Amenity, LucideIcon>> = {
  AC: Wind,
  WIFI: Wifi,
  TOILET: Coffee,
  LUGGAGE: Briefcase,
};

export const AMENITY_LABEL: Partial<Record<Amenity, string>> = {
  AC: "A/C",
  WIFI: "WiFi",
  TOILET: "Toilet",
  LUGGAGE: "Luggage",
};

export function AmenityChips({ amenities }: { amenities: Amenity[] }) {
  if (amenities.length === 0) return null;

  return (
    <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
      <span>Includes:</span>
      <div className="flex flex-wrap items-center gap-3">
        {amenities.map((amenity) => {
          const Icon = AMENITY_ICON[amenity];
          const label = AMENITY_LABEL[amenity];
          if (!Icon || !label) return null;
          return (
            <span
              key={amenity}
              className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md text-[10px] font-bold text-slate-500"
            >
              <Icon className="h-3 w-3 text-pink-500" /> {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
