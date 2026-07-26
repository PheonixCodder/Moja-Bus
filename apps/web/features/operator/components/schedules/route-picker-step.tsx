"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@moja/ui/lib/utils";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@moja/ui/components/ui/empty";
import type { RouteListItem } from "@/features/operator/lib/schedules/types";

export function RoutePickerStep({
  routes,
  selectedId,
  onSelect,
  name,
  onNameChange,
}: {
  routes: RouteListItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  name: string;
  onNameChange: (val: string) => void;
}) {
  const t = useTranslations("operatorDashboard.schedules");
  const tc = useTranslations("common");
  const activeRoutes = routes.filter((r) => r.status === "ACTIVE");

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="schedule-name" className="text-sm font-bold text-foreground">
          {t("wizard.scheduleName")}
        </Label>
        <Input
          id="schedule-name"
          placeholder={t("wizard.scheduleNamePlaceholder")}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div>
        <h3 className="text-sm font-bold text-foreground">{t("wizard.selectRoute")}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("wizard.onlyActiveRoutes")}
        </p>
      </div>

      {activeRoutes.length === 0 ? (
        <Empty className="py-10">
          <EmptyMedia>
            <ArrowRight className="size-8 text-muted-foreground/30" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>{t("wizard.noActiveRoutes")}</EmptyTitle>
            <EmptyDescription>
              {t("wizard.noActiveRoutesDesc")}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link href="/dashboard/operator/routes">
              <Button size="sm" variant="outline">
                {t("wizard.goToRoutes")}
              </Button>
            </Link>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {activeRoutes.map((r) => {
            const isSelected = r.id === selectedId;
            return (
              <button
                type="button"
                key={r.id}
                onClick={() => onSelect(r.id)}
                className={cn(
                  "text-left p-4 rounded-md border transition-all duration-150",
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border bg-card hover:border-primary/30",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-foreground">{r.name}</p>
                  {isSelected && (
                    <CheckCircle2 className="size-4 text-primary shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-xs text-muted-foreground">
                    {r.originTerminal?.cityRelation?.name ??
                      r.originTerminal?.city}
                  </span>
                  <ArrowRight className="size-3 text-muted-foreground/40" />
                  <span className="text-xs text-muted-foreground">
                    {r.destTerminal?.cityRelation?.name ?? r.destTerminal?.city}
                  </span>
                </div>
{r.distanceKm ? (
                   <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                     {r.distanceKm} km
                   </p>
                 ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
