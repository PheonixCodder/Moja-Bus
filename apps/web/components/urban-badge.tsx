import { Badge } from "@moja/ui/components/ui/badge";
import { useTranslations } from "next-intl";

/** Single source of truth for the URBAN service badge across all surfaces. */
export function UrbanBadge() {
  const t = useTranslations("common");
  return (
    <Badge className="bg-success/10 text-success hover:bg-success/15 border border-success/20 text-[10px] font-semibold py-0">
      {t("urban")}
    </Badge>
  );
}
