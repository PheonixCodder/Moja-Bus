import { Badge } from "@moja/ui/components/ui/badge";

/** Single source of truth for the URBAN service badge across all surfaces. */
export function UrbanBadge() {
  return (
    <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200 text-[10px] font-semibold py-0">
      Urban
    </Badge>
  );
}
