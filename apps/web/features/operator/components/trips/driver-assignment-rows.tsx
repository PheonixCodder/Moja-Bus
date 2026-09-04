"use client";

import { Avatar, AvatarFallback } from "@moja/ui/components/ui/avatar";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@moja/ui/components/ui/combobox";
import { cn } from "@moja/ui/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ClipboardCheck,
  CircleOff,
  ShieldAlert,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

type Role = "PRIMARY" | "RELIEF" | "CONDUCTOR";

type PendingAttempt = { driverProfileId: string; role: Role };
const pendingRef: { current: PendingAttempt } = {
  current: { driverProfileId: "", role: "PRIMARY" as Role },
};

const ROLE_CONFIG: Record<
  Role,
  { icon: typeof UserCheck; labelKey: string; accent: string }
> = {
  PRIMARY: {
    icon: UserCheck,
    labelKey: "driverRow.primary",
    accent: "text-primary",
  },
  RELIEF: {
    icon: Users,
    labelKey: "driverRow.relief",
    accent: "text-blue-500",
  },
  CONDUCTOR: {
    icon: ClipboardCheck,
    labelKey: "driverRow.conductor",
    accent: "text-violet-500",
  },
};

export function DriverAssignmentRows({
  tripId,
  canAssign,
  holders,
}: {
  tripId: string;
  canAssign: boolean;
  /** Current occupant per role, keyed PRIMARY/RELIEF/CONDUCTOR. */
  holders: Record<Role, { id: string; name: string } | null>;
}) {
  const t = useTranslations("operatorDashboard.trips");
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const eligibleQuery = useQuery({
    ...trpc.drivers.listAssignableDrivers.queryOptions({ tripId }),
    enabled: canAssign,
    staleTime: 15_000,
  });

  const conductorsQuery = useQuery({
    ...trpc.staff.listStaff.queryOptions({
      role: "CONDUCTOR",
      status: "ACTIVE",
      limit: 100,
    }),
    enabled: canAssign,
    staleTime: 30_000,
  });

  function invalidateBoards() {
    void queryClient.invalidateQueries({
      predicate: (q: any) =>
        String(q.queryHash).includes("trips.list") ||
        String(q.queryHash).includes("listAssignableDrivers") ||
        String(q.queryHash).includes("staff.listStaff"),
    });
  }

  const assignMutation = useMutation({
    ...trpc.trips.assignDriver.mutationOptions(),
    onSuccess: () => {
      toast.success(t("driverAssigned"));
      invalidateBoards();
    },
    onError: (err: any) => {
      const msg: string = err?.message ?? "";
      const match = msg.match(/^(PRIMARY|RELIEF)_ASSIGNED::(.+)$/);
      if (match) {
        // Slot was taken between render and submit — surface who holds it.
        if (
          window.confirm(
            `${t("replaceConfirmTitle")}\n\n${t("replaceConfirmMessage", { name: match[2] ?? "" })}`,
          )
        ) {
          assignMutation.mutate({
            tripId,
            driverProfileId: pendingRef.current.driverProfileId,
            role: pendingRef.current.role as "PRIMARY" | "RELIEF",
            startStopOrder: 0,
            replacePrimary: true,
          });
          return;
        }
        return;
      }
      toast.error(msg || t("failedAssignDriver"));
    },
  });

  const unassignMutation = useMutation({
    ...trpc.trips.unassignDriver.mutationOptions(),
    onSuccess: () => {
      toast.success(t("driverUnassignedToast"));
      invalidateBoards();
    },
    onError: (err: any) => toast.error(err?.message || t("failedAssignDriver")),
  });

  const assignConductorMutation = useMutation({
    ...trpc.trips.assignConductor.mutationOptions(),
    onSuccess: () => {
      toast.success(t("driverAssigned"));
      invalidateBoards();
    },
    onError: (err: any) => toast.error(err?.message || t("failedAssignDriver")),
  });

  const unassignConductorMutation = useMutation({
    ...trpc.trips.unassignConductor.mutationOptions(),
    onSuccess: () => {
      toast.success(t("driverUnassignedToast"));
      invalidateBoards();
    },
    onError: (err: any) => toast.error(err?.message || t("failedAssignDriver")),
  });

  const drivers = eligibleQuery.data?.items ?? [];
  const conductors = conductorsQuery.data?.members ?? [];

  const handleSelect = (role: Role, selectedId: string) => {
    if (!selectedId || selectedId === "__disabled__") return;

    const occupant = holders[role];
    if (occupant && occupant.id !== selectedId) {
      if (
        !window.confirm(
          `${t("replaceConfirmTitle")}\n\n${t("replaceConfirmMessage", { name: occupant.name })}`,
        )
      ) {
        return;
      }
    }

    if (role === "CONDUCTOR") {
      assignConductorMutation.mutate({
        tripId,
        staffId: selectedId,
      });
      return;
    }

    pendingRef.current = { driverProfileId: selectedId, role };
    assignMutation.mutate({
      tripId,
      driverProfileId: selectedId,
      role: role as "PRIMARY" | "RELIEF",
      startStopOrder: 0,
      ...(occupant && occupant.id !== selectedId
        ? { replacePrimary: true }
        : {}),
    });
  };

  if (!canAssign) return null;

  return (
    <div className="space-y-1.5">
      {(Object.keys(ROLE_CONFIG) as Role[]).map((role) => {
        const cfg = ROLE_CONFIG[role];
        const Icon = cfg.icon;
        const holder = holders[role];
        const isConductorRow = role === "CONDUCTOR";

        return (
          <div key={role} className="flex items-center gap-2">
            <Icon className={cn("size-4 shrink-0", cfg.accent)} />
            <span className="w-16 shrink-0 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              {t(cfg.labelKey)}
            </span>

            {holder ? (
              <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                <Avatar className="size-4">
                  <AvatarFallback className="text-[7px]">
                    {holder.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="max-w-[140px] truncate">{holder.name}</span>
                <button
                  type="button"
                  aria-label={t("unassignAria")}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-emerald-200/60"
                  onClick={() => {
                    if (role === "CONDUCTOR") {
                      unassignConductorMutation.mutate({ tripId });
                    } else {
                      unassignMutation.mutate({
                        tripId,
                        driverProfileId: holder.id,
                        role,
                      });
                    }
                  }}
                >
                  <X className="size-3" />
                </button>
              </span>
            ) : isConductorRow ? (
              <div className="min-w-0 flex-1">
                <Combobox
                  items={conductors.map((c) => ({
                    value: c.id,
                    label: c.user?.fullName ?? c.user?.email ?? "—",
                  }))}
                  value=""
                  onValueChange={(val) => handleSelect(role, val ?? "")}
                  disabled={conductorsQuery.isLoading || assignConductorMutation.isPending}
                >
                  <ComboboxInput
                    placeholder={
                      conductorsQuery.isLoading
                        ? t("driverSearching")
                        : t("driverAssignPlaceholder")
                    }
                    className="h-8 w-full text-xs"
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>{t("driverNoEligible")}</ComboboxEmpty>
                    <ComboboxList>
                      {conductors.map((c) => (
                        <ComboboxItem
                          key={c.id}
                          value={c.id}
                          className="text-xs"
                        >
                          <span className="flex w-full items-center justify-between gap-2">
                            <span className="truncate">
                              {c.user?.fullName ?? c.user?.email ?? "—"}
                            </span>
                            <span className="shrink-0 text-[10px] text-muted-foreground">
                              {c.user?.phoneNumber ?? ""}
                            </span>
                          </span>
                        </ComboboxItem>
                      ))}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>
            ) : (
              <div className="min-w-0 flex-1">
                <Combobox
                  items={drivers.map((d) => ({
                    value: d.driverProfileId,
                    label: d.fullName ?? "—",
                    disabled:
                      !d.licenseOk || !!d.conflict || d.rolesOnTrip.length > 0,
                  }))}
                  value=""
                  onValueChange={(val) => handleSelect(role, val ?? "")}
                  disabled={eligibleQuery.isLoading || assignMutation.isPending}
                >
                  <ComboboxInput
                    placeholder={
                      eligibleQuery.isLoading
                        ? t("driverSearching")
                        : t("driverAssignPlaceholder")
                    }
                    className="h-8 w-full text-xs"
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>{t("driverNoEligible")}</ComboboxEmpty>
                    <ComboboxList>
                      {drivers.map((d) => {
                        const ineligible =
                          !d.licenseOk ||
                          !!d.conflict ||
                          d.rolesOnTrip.length > 0;
                        let reason = "";
                        if (!d.licenseOk)
                          reason = t("licenseMismatch", {
                            required: d.requiredLicense ?? "—",
                          });
                        else if (d.conflict) reason = t("conflictBusy");
                        else if (d.rolesOnTrip.length > 0)
                          reason = t("alreadyOnTrip");
                        const modeMismatch = !d.modeOk;

                        return (
                          <ComboboxItem
                            key={d.driverProfileId}
                            value={
                              ineligible ? "__disabled__" : d.driverProfileId
                            }
                            disabled={ineligible}
                            className="text-xs"
                          >
                            <span className="flex w-full items-center justify-between gap-2">
                              <span className="truncate">{d.fullName}</span>
                              <span className="flex shrink-0 items-center gap-1.5 text-[10px] text-muted-foreground">
                                {d.liveStatus === "AVAILABLE" && (
                                  <span className="rounded bg-emerald-100 px-1 font-semibold text-emerald-700">
                                    {t("liveAvailable")}
                                  </span>
                                )}
                                {modeMismatch && (
                                  <span className="rounded bg-amber-50 px-1 font-semibold text-amber-700">
                                    {t("modeMismatch")}
                                  </span>
                                )}
                                {!d.licenseOk && (
                                  <ShieldAlert className="size-3 text-rose-500" />
                                )}
                                {d.conflict && (
                                  <AlertTriangle className="size-3 text-amber-500" />
                                )}
                                {modeMismatch && (
                                  <CircleOff className="size-3 text-amber-500" />
                                )}
                                {reason && (
                                  <span className="max-w-[150px] truncate">
                                    {reason}
                                  </span>
                                )}
                              </span>
                            </span>
                          </ComboboxItem>
                        );
                      })}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
