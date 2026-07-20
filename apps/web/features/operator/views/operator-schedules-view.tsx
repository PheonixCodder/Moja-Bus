"use client";

import { useEffect, useState } from "react";
import { useQueryStates } from "nuqs";
import {
  CalendarClock,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@moja/ui/components/ui/button";
import { Spinner } from "@moja/ui/components/ui/spinner";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@moja/ui/components/ui/empty";
import { useTRPC } from "@/trpc/client";
import {
  useSuspenseQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useStaffPermissions } from "@/features/operator/hooks/use-staff-permissions";
import { scheduleListParsers } from "@/features/operator/lib/schedules/schedule-search-params";
import {
  WIZARD_STEPS,
  type WizardStep,
  type ScheduleListItem,
  type ScheduleDetail,
  type RouteDetail,
  type FareDraft,
  type CalendarConfig,
  defaultCalendarConfig,
  buildStopsFromRoute,
  hasRequiredFullRouteFare,
} from "@/features/operator/lib/schedules/types";
import { WizardStepper } from "@/features/operator/components/schedules/wizard-stepper";
import { RoutePickerStep } from "@/features/operator/components/schedules/route-picker-step";
import { CalendarStep } from "@/features/operator/components/schedules/calendar-step";
import { PricingStep } from "@/features/operator/components/schedules/pricing-step";
import { PreviewStep } from "@/features/operator/components/schedules/preview-step";
import { ScheduleToolbar } from "@/features/operator/components/schedules/schedule-toolbar";
import { ScheduleCard } from "@/features/operator/components/schedules/schedule-card";
import { ScheduleSuccessBanner } from "@/features/operator/components/schedules/schedule-success-banner";
import { ScheduleDeleteDialog } from "@/features/operator/components/schedules/schedule-delete-dialog";
import { ScheduleEditDrawer } from "@/features/operator/components/schedules/schedule-edit-drawer";

export function OperatorSchedulesView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { can } = useStaffPermissions();
  const canCreate = can("schedules:create");
  const canUpdate = can("schedules:update");
  const canDelete = can("schedules:delete");

  const [params, setParams] = useQueryStates(scheduleListParsers);
  const {
    q,
    status,
    page,
    sort,
    routeId,
    new: wizardOpen,
    step,
    routePick,
    edit: editId,
  } = params;

  const listInput = {
    q: q || undefined,
    routeId: routeId || undefined,
    isActive:
      status === "active" ? true : status === "inactive" ? false : undefined,
    page,
    pageSize: 24,
    sort,
  };

  const { data: listData } = useSuspenseQuery(
    trpc.schedules.list.queryOptions(listInput),
  );

  const needFleet =
    wizardOpen || !!editId || canCreate || canUpdate;
  const { data: routesData } = useQuery({
    ...trpc.routes.list.queryOptions(),
    enabled: can("routes:read"),
  });
  const { data: busesData } = useQuery({
    ...trpc.fleet.getBuses.queryOptions({ slim: true }),
    enabled: needFleet && (canCreate || canUpdate || can("fleet:read")),
  });

  const routes = routesData ?? [];
  const buses = busesData?.buses ?? [];

  const [maxStep, setMaxStep] = useState(0);
  const [wizardScheduleName, setWizardScheduleName] = useState("");
  const [selectedRoute, setSelectedRoute] = useState<RouteDetail | null>(null);
  const [loadingRouteDetail, setLoadingRouteDetail] = useState(false);
  const [calConfig, setCalConfig] = useState<CalendarConfig>(
    defaultCalendarConfig,
  );
  const [fares, setFares] = useState<FareDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [deletingSchedule, setDeletingSchedule] =
    useState<ScheduleListItem | null>(null);
  const [editingDetail, setEditingDetail] = useState<ScheduleDetail | null>(
    null,
  );
  const [extendingScheduleId, setExtendingScheduleId] = useState<string | null>(
    null,
  );

  const createScheduleMutation = useMutation({
    ...trpc.schedules.create.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.schedules.list.pathFilter());
    },
  });
  const deleteScheduleMutation = useMutation({
    ...trpc.schedules.delete.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.schedules.list.pathFilter());
    },
  });
  const retireMutation = useMutation({
    ...trpc.schedules.retire.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.schedules.list.pathFilter());
    },
  });
  const regenerateTripsMutation = useMutation({
    ...trpc.schedules.regenerateTrips.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.schedules.list.pathFilter());
    },
  });

  useEffect(() => {
    if (!routePick) {
      setSelectedRoute(null);
      return;
    }
    setFares([]);
    setLoadingRouteDetail(true);
    queryClient
      .fetchQuery(trpc.routes.get.queryOptions({ id: routePick }))
      .then((data) => setSelectedRoute(data))
      .catch(() => toast.error("Failed to load route details"))
      .finally(() => setLoadingRouteDetail(false));
  }, [routePick, queryClient, trpc.routes.get]);

  useEffect(() => {
    if (!editId) {
      setEditingDetail(null);
      return;
    }
    if (!canUpdate) return;
    queryClient
      .fetchQuery(trpc.schedules.get.queryOptions({ id: editId }))
      .then((detail) => setEditingDetail(detail))
      .catch(() => {
        toast.error("Failed to load schedule details");
        setParams({ edit: "" });
      });
  }, [editId, canUpdate, queryClient, trpc.schedules.get, setParams]);

  const stops = selectedRoute ? buildStopsFromRoute(selectedRoute) : [];

  function goToStep(s: WizardStep) {
    const idx = WIZARD_STEPS.indexOf(s);
    setMaxStep((prev) => Math.max(prev, idx));
    setParams({ step: s });
  }

  function canProceed() {
    if (step === "Route") return !!routePick;
    if (step === "Calendar") {
      const hasDays = Object.values(calConfig.days).some(Boolean);
      return (
        hasDays &&
        !!calConfig.departureTime &&
        !!calConfig.validFrom &&
        !!calConfig.preferredBusId
      );
    }
    if (step === "Pricing") {
      return hasRequiredFullRouteFare(fares, stops);
    }
    return true;
  }

  async function handlePublish() {
    if (!routePick || !calConfig.preferredBusId) return;
    setSaving(true);
    try {
      const lastStop = stops[stops.length - 1]?.order ?? 1;
      const result = await createScheduleMutation.mutateAsync({
        name: wizardScheduleName || null,
        routeId: routePick,
        preferredBusId: calConfig.preferredBusId,
        defaultBusId: calConfig.preferredBusId,
        departureTime: calConfig.departureTime,
        routeLastStopOrder: lastStop,
        calendar: {
          monday: calConfig.days.monday,
          tuesday: calConfig.days.tuesday,
          wednesday: calConfig.days.wednesday,
          thursday: calConfig.days.thursday,
          friday: calConfig.days.friday,
          saturday: calConfig.days.saturday,
          sunday: calConfig.days.sunday,
          validFrom: calConfig.validFrom,
          ...(calConfig.validUntil ? { validUntil: calConfig.validUntil } : {}),
        },
        fares: fares
          .filter((f) => f.priceXOF > 0)
          .map((f) => ({
            type: f.type,
            seatClass: f.seatClass,
            fromStopOrder: f.fromStopOrder,
            toStopOrder: f.toStopOrder,
            priceXOF: f.priceXOF,
          })),
      });
      setSuccessCount(result.tripsCreated ?? result._count?.trips ?? 0);
      if (result.warning) {
        toast.warning(result.warning);
      }
      resetWizard();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to publish schedule",
      );
    } finally {
      setSaving(false);
    }
  }

  function resetWizard() {
    setMaxStep(0);
    setSelectedRoute(null);
    setFares([]);
    setCalConfig(defaultCalendarConfig());
    setWizardScheduleName("");
    setParams({ new: false, step: "Route", routePick: "" });
  }

  async function handleExtend(schedule: ScheduleListItem | ScheduleDetail) {
    setExtendingScheduleId(schedule.id);
    try {
      const busId =
        ("preferredBusId" in schedule && schedule.preferredBusId) ||
        buses.find((b) => b.status === "ACTIVE")?.id;
      if (!busId) {
        toast.error("No preferred or active bus available");
        return;
      }
      if (!schedule.isActive) {
        toast.error("Reactivate the schedule before extending trips");
        return;
      }
      const res = await regenerateTripsMutation.mutateAsync({
        id: schedule.id,
        preferredBusId: busId,
        persist: true,
      });
      toast.success(
        res?.message ||
          `Successfully generated ${res?.tripsCreated ?? 0} trips.`,
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to extend trips");
    } finally {
      setExtendingScheduleId(null);
    }
  }

  async function handleRetire(schedule: ScheduleListItem) {
    if (
      !window.confirm(
        "Retire this schedule? It will be deactivated and unbooked future trips will be pruned.",
      )
    ) {
      return;
    }
    try {
      const res = await retireMutation.mutateAsync({ id: schedule.id });
      toast.success(
        `Schedule retired. ${res.prunedTrips} empty future trip(s) pruned.`,
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to retire");
    }
  }

  // Wizard mode
  if (wizardOpen && canCreate) {
    return (
      <div className="flex flex-col h-full">
        <WizardStepper
          current={step}
          onStepClick={goToStep}
          maxReached={maxStep}
        />

        <div className="flex-1 overflow-y-auto px-5 py-6">
          {step === "Route" && (
            <RoutePickerStep
              routes={routes}
              selectedId={routePick}
              name={wizardScheduleName}
              onNameChange={setWizardScheduleName}
              onSelect={(id) => {
                setParams({ routePick: id });
                setFares([]);
              }}
            />
          )}
          {step === "Calendar" && (
            <CalendarStep
              config={calConfig}
              buses={buses}
              onChange={setCalConfig}
            />
          )}
          {step === "Pricing" &&
            (loadingRouteDetail ? (
              <div className="flex items-center gap-2 py-10 justify-center">
                <Spinner className="size-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  Loading route stops…
                </span>
              </div>
            ) : (
              <PricingStep stops={stops} fares={fares} onChange={setFares} />
            ))}
          {step === "Preview" && (
            <PreviewStep
              days={calConfig.days}
              validFrom={calConfig.validFrom}
              validUntil={calConfig.validUntil}
              departureTime={calConfig.departureTime}
              routeName={(selectedRoute as { name?: string } | null)?.name ?? ""}
              fares={fares}
            />
          )}
        </div>

        <div className="border-t border-border px-5 py-4 flex items-center gap-3 shrink-0 bg-background">
          <Button variant="outline" onClick={resetWizard} disabled={saving}>
            Cancel
          </Button>
          <div className="flex-1" />
          {step !== "Route" && (
            <Button
              variant="ghost"
              onClick={() => {
                const idx = WIZARD_STEPS.indexOf(step);
                if (idx > 0) setParams({ step: WIZARD_STEPS[idx - 1]! });
              }}
              disabled={saving}
            >
              Back
            </Button>
          )}
          {step !== "Preview" ? (
            <Button
              onClick={() => {
                const idx = WIZARD_STEPS.indexOf(step);
                if (idx < WIZARD_STEPS.length - 1) {
                  goToStep(WIZARD_STEPS[idx + 1]!);
                }
              }}
              disabled={!canProceed()}
            >
              Continue →
            </Button>
          ) : (
            <Button onClick={handlePublish} disabled={saving || !canProceed()}>
              {saving ? <Spinner className="size-4 mr-2" /> : null}
              {saving ? "Publishing…" : "Publish Schedule"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // List mode
  return (
    <div className="flex flex-col h-full">
      <ScheduleToolbar
        total={listData.total}
        q={q}
        onQChange={(v) => setParams({ q: v || null, page: 1 })}
        status={status}
        onStatusChange={(v) => setParams({ status: v, page: 1 })}
        canCreate={canCreate}
        onNew={() => setParams({ new: true, step: "Route" })}
        routeId={routeId}
        onRouteChange={(id) => setParams({ routeId: id || null, page: 1 })}
        routes={(routesData ?? []).map((r: any) => ({
          id: r.id,
          label: `${r.originTerminal?.cityRelation?.name ?? r.originTerminal?.city ?? "Origin"} → ${r.destTerminal?.cityRelation?.name ?? r.destTerminal?.city ?? "Dest"}`,
        }))}
      />

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {successCount !== null && (
          <ScheduleSuccessBanner
            tripsCreated={successCount}
            onDismiss={() => setSuccessCount(null)}
          />
        )}

        {listData.items.length === 0 ? (
          <Empty className="py-16">
            <EmptyMedia>
              <CalendarClock className="size-10 text-muted-foreground/30" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No schedules yet</EmptyTitle>
              <EmptyDescription>
                A schedule turns a route into recurring trips. Create your first
                one to start accepting bookings.
              </EmptyDescription>
            </EmptyHeader>
            {canCreate && (
              <EmptyContent>
                <Button
                  size="sm"
                  onClick={() => setParams({ new: true, step: "Route" })}
                >
                  <Plus className="size-3.5 mr-1.5" />
                  Create Schedule
                </Button>
              </EmptyContent>
            )}
          </Empty>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listData.items.map((s) => (
                <ScheduleCard
                  key={s.id}
                  schedule={s}
                  canUpdate={canUpdate}
                  canDelete={canDelete}
                  extending={extendingScheduleId === s.id}
                  onEdit={(sch) => setParams({ edit: sch.id })}
                  onDelete={setDeletingSchedule}
                  onExtend={handleExtend}
                  onRetire={handleRetire}
                />
              ))}
            </div>
            {listData.pageCount > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setParams({ page: page - 1 })}
                >
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground">
                  Page {listData.page} of {listData.pageCount}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= listData.pageCount}
                  onClick={() => setParams({ page: page + 1 })}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <ScheduleEditDrawer
        open={!!editId && !!editingDetail}
        schedule={editingDetail}
        buses={buses}
        extending={extendingScheduleId === editingDetail?.id}
        onOpenChange={(open) => {
          if (!open) setParams({ edit: "" });
        }}
        onExtend={() => editingDetail && handleExtend(editingDetail)}
      />

      <ScheduleDeleteDialog
        schedule={deletingSchedule}
        pending={deleteScheduleMutation.isPending}
        onClose={() => setDeletingSchedule(null)}
        onConfirm={async () => {
          if (!deletingSchedule) return;
          try {
            await deleteScheduleMutation.mutateAsync({
              id: deletingSchedule.id,
            });
            toast.success("Schedule deleted");
            setDeletingSchedule(null);
          } catch (err) {
            toast.error(
              err instanceof Error ? err.message : "Failed to delete schedule",
            );
          }
        }}
      />
    </div>
  );
}
