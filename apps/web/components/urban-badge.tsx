import { Badge } from "@moja/ui/components/ui/badge";
import { useTranslations } from "next-intl";

/** Single source of truth for the URBAN service badge across all surfaces. */
export function UrbanBadge() {
  const t = useTranslations("common");
  return (
    <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200 text-[10px] font-semibold py-0">
      {t("urban")}
    </Badge>
  );
}
