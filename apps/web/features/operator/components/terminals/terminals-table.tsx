"use client";

import { Button } from "@moja/ui/components/ui/button";
import { Switch } from "@moja/ui/components/ui/switch";
import { Building, Link2, MapPin, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatCityWithMuni } from "@/lib/format-location-label";

interface TerminalsTableProps {
  locations: any[];
  onEdit?: ((loc: any) => void) | undefined;
  onToggleTerminal?: ((loc: any, currentVal: boolean) => void) | undefined;
  onDelete?: ((loc: any) => void) | undefined;
  onResolveCapture?: ((loc: any) => void) | undefined;
  togglingId?: string | null;
  canEdit: boolean;
  canDelete: boolean;
  canToggle: boolean;
  canResolveCapture: boolean;
}

function CaptureStatusBadge({
  status,
  captureStatus,
  t,
}: {
  status: string;
  captureStatus?: string | null;
  t: (key: string) => string;
}) {
  const submitted = status === "PENDING_CONFIRMATION";
  const awaitingApproval = captureStatus === "CONFIRMED";
  const tone = awaitingApproval
    ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
    : submitted
      ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
      : "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  const label = awaitingApproval
    ? t("capture.statusPendingApproval")
    : submitted
      ? t("capture.statusSubmitted")
      : t("capture.statusAwaitingCapture");
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tone}`}
    >
      {label}
    </span>
  );
}

export function TerminalsTable({
  locations,
  onEdit,
  onToggleTerminal,
  onDelete,
  onResolveCapture,
  togglingId,
  canToggle,
  canResolveCapture,
  canEdit,
  canDelete,
}: TerminalsTableProps) {
  const t = useTranslations("operatorDashboard.terminals");
  const tc = useTranslations("common");

  if (!locations || locations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-lg bg-card/50">
        <Building className="size-10 text-muted-foreground/50 mb-3" />
        <h3 className="text-base font-semibold text-foreground">
          {t("noLocations")}
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm mt-1">
          {t("noLocationsDesc")}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-left text-sm border-collapse min-w-[700px]">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3">{tc("name")}</th>
            <th className="px-4 py-3">{t("type")}</th>
            <th className="px-4 py-3">
              {tc("city")} & {tc("address")}
            </th>
            <th className="px-4 py-3">{tc("phone")}</th>
            <th className="px-4 py-3">{tc("status")}</th>
            <th className="px-4 py-3 text-right">{tc("actions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {locations.map((loc) => (
            <tr key={loc.id} className="hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3.5 font-medium text-foreground">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded bg-primary/10 text-primary shrink-0">
                    {loc.isTerminal ? (
                      <MapPin className="size-3.5" />
                    ) : (
                      <Building className="size-3.5" />
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">
                      {loc.name}
                    </span>
                    {loc.isPrimary && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                        {t("primaryHub")}
                      </span>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-2">
                  {canToggle && onToggleTerminal ? (
                    <Switch
                      checked={loc.isTerminal}
                      disabled={togglingId === loc.id}
                      onCheckedChange={() =>
                        onToggleTerminal(loc, loc.isTerminal)
                      }
                    />
                  ) : null}
                  <span className="text-xs font-medium text-muted-foreground">
                    {loc.isTerminal ? t("terminals") : t("depots")}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3.5 text-xs text-muted-foreground">
                <div>
                  {formatCityWithMuni(
                    loc.cityRelation?.name ?? loc.city,
                    loc.municipality?.name,
                  ) || tc("noData")}
                </div>
                <div className="text-[11px] text-muted-foreground/70 truncate max-w-[200px]">
                  {loc.addressLine1}
                </div>
              </td>
              <td className="px-4 py-3.5 text-xs font-mono text-foreground">
                {loc.phone || "—"}
              </td>
              <td className="px-4 py-3.5">
                <div className="flex flex-col items-start gap-1">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      loc.isActive
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {loc.isActive ? t("active") : t("inactive")}
                  </span>
                  {loc.geoCaptureStatus &&
                    loc.geoCaptureStatus !== "COMPLETE" && (
                      <CaptureStatusBadge
                        status={loc.geoCaptureStatus}
                        captureStatus={loc.captures?.[0]?.status}
                        t={t}
                      />
                    )}
                </div>
              </td>
              <td className="px-4 py-3.5 text-right space-x-1">
                {canResolveCapture &&
                  onResolveCapture &&
                  loc.geoCaptureStatus !== "COMPLETE" &&
                  loc.captures?.[0]?.status === "CONFIRMED" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-[11px] font-semibold text-violet-600 dark:text-violet-400 border-violet-500/30 hover:bg-violet-500/10"
                      onClick={() => onResolveCapture(loc)}
                    >
                      <Link2 className="size-3.5" />
                      {t("resolve.title")}
                    </Button>
                  )}
                {canEdit && onEdit ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => onEdit(loc)}
                    title={tc("edit")}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                ) : null}
                {canDelete && onDelete ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive hover:bg-destructive/10"
                    onClick={() => onDelete(loc)}
                    title={t("deleteLocation")}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
