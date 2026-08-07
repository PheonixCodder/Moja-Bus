"use client";

import { cn } from "@moja/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CheckCircle2, Clock, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTRPC } from "@/trpc/client";

const STATUS_ORDER = [
  "SCHEDULED",
  "BOARDING",
  "DEPARTED",
  "DELAYED",
  "ARRIVED",
  "CANCELLED",
];

function stepDone(current: string, step: string): boolean {
  return STATUS_ORDER.indexOf(current) >= STATUS_ORDER.indexOf(step);
}

export function TripAuditTimeline({ tripId }: { tripId: string }) {
  const t = useTranslations("adminDashboard.tripAuditTimeline");
  const trpc = useTRPC();
  const { data: trip } = useQuery(
    trpc.admin.getTripAudit.queryOptions({ id: tripId }),
  );

  if (!trip) return null;

  const steps = [
    {
      label: t("stepScheduled"),
      status: "SCHEDULED",
      time: trip.departureDate
        ? format(new Date(trip.departureDate), "MMM d, h:mm a")
        : null,
      note: t("plannedDeparture"),
    },
    {
      label: t("stepBoarding"),
      status: "BOARDING",
      time: null,
      note: t("passengersEmbarking"),
    },
    {
      label: t("stepDeparted"),
      status: "DEPARTED",
      time: trip.actualDeparture
        ? format(new Date(trip.actualDeparture), "MMM d, h:mm a")
        : null,
      note: trip.actualDeparture ? t("actualDeparture") : t("notYetDeparted"),
    },
    {
      label: t("stepArrived"),
      status: "ARRIVED",
      time: trip.actualArrival
        ? format(new Date(trip.actualArrival), "MMM d, h:mm a")
        : trip.estimatedArrival
          ? format(new Date(trip.estimatedArrival), "MMM d, h:mm a")
          : null,
      note: trip.actualArrival ? t("actualArrival") : t("estimatedArrival"),
    },
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <h3 className="text-sm font-bold text-foreground mb-6">
        {t("tripTimeline")}
      </h3>
      <div className="relative">
        {/* Connector line */}
        <div className="absolute left-4 top-5 bottom-5 w-px bg-border" />

        <div className="space-y-6">
          {steps.map((step, idx) => {
            const done = stepDone(trip.status, step.status);
            const active = trip.status === step.status;

            return (
              <div key={idx} className="relative flex items-start gap-4 pl-2">
                <div
                  className={cn(
                    "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2 mt-0.5",
                    active &&
                      "border-primary bg-primary text-white shadow-md shadow-primary/30",
                    done &&
                      !active &&
                      "border-emerald-500 bg-emerald-500 text-white",
                    !done && "border-border bg-card text-muted-foreground",
                  )}
                >
                  {done ? (
                    <CheckCircle2 className="size-3" />
                  ) : (
                    <div className="size-2 rounded-full bg-current" />
                  )}
                </div>

                <div className="pb-2">
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      active
                        ? "text-primary"
                        : done
                          ? "text-foreground"
                          : "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {step.time && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        {step.time}
                      </span>
                    )}
                    {step.note && !step.time && (
                      <span className="text-xs text-muted-foreground">
                        {step.note}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stop-by-stop list */}
      {trip.tripStops.length > 0 && (
        <div className="mt-6 pt-6 border-t border-border">
          <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-4">
            {t("stopSequence")}
          </h4>
          <div className="space-y-3">
            {trip.tripStops.map((stop, idx) => (
              <div key={stop.id} className="flex items-start gap-3">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 mt-0.5">
                  {idx + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {stop.terminal.cityRelation?.name ?? stop.terminal.name}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-0.5">
                    {stop.scheduledArrival && (
                      <span className="text-xs text-muted-foreground">
                        {t("arrLabel")}:{" "}
                        {format(new Date(stop.scheduledArrival), "h:mm a")}
                      </span>
                    )}
                    {stop.scheduledDeparture && (
                      <span className="text-xs text-muted-foreground">
                        {t("depLabel")}:{" "}
                        {format(new Date(stop.scheduledDeparture), "h:mm a")}
                      </span>
                    )}
                    {stop.actualArrival && (
                      <span className="text-xs font-medium text-emerald-600">
                        {t("actualArrLabel")}:{" "}
                        {format(new Date(stop.actualArrival), "h:mm a")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
