"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Store,
  Star,
  ShieldCheck,
  ShieldAlert,
  Search,
  Sparkles,
  Ban,
  RotateCcw,
  Eye,
  Clock,
  ChevronDown,
  ChevronUp,
  Users,
  Briefcase,
} from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Textarea } from "@moja/ui/components/ui/textarea";
import { Label } from "@moja/ui/components/ui/label";
import { Badge } from "@moja/ui/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@moja/ui/components/ui/avatar";
import { Skeleton } from "@moja/ui/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@moja/ui/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@moja/ui/components/ui/table";
import { useTRPC } from "@/trpc/client";
import { cn } from "@moja/ui/lib/utils";
import { TrustBadges } from "@/features/operator/components/drivers/trust-badges";

// ─── Shared bits ─────────────────────────────────────────────────────────────

const OFFER_STATUS_BADGES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  COUNTERED: "bg-blue-50 text-blue-700 border-blue-200",
  ACCEPTED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DECLINED: "bg-rose-50 text-rose-700 border-rose-200",
  EXPIRED: "bg-zinc-100 text-zinc-600 border-zinc-200",
  WITHDRAWN: "bg-slate-100 text-slate-500 border-slate-200",
};

const EVENT_LABELS: Record<string, string> = {
  SENT: "Offer sent",
  VIEWED: "Seen by driver",
  COUNTERED_BY_DRIVER: "Driver countered",
  COUNTERED_BY_OPERATOR: "Operator countered back",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  WITHDRAWN: "Withdrawn",
  EXPIRED: "Expired",
  AFFILIATION_CREATED: "Affiliation created",
  EXCLUSIVE_ENDED: "Exclusive ended",
};

function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
  sub,
}: {
  label: string;
  value: string | number;
  icon: typeof Store;
  accent: string;
  sub?: string;
}) {
  return (
    <div className="p-4 rounded-xl border bg-white space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        <Icon className={cn("size-4", accent)} />
      </div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
      {sub && <p className="text-[11px] text-slate-500 font-medium">{sub}</p>}
    </div>
  );
}

// ─── Suspend reason dialog ───────────────────────────────────────────────────

function SuspendDialog({
  target,
  onClose,
}: {
  target: { id: string; name: string } | null;
  onClose: () => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    ...trpc.admin.setDriverMarketplaceStatus.mutationOptions(),
    onSuccess: () => {
      toast.success("Driver suspended and notified");
      queryClient.invalidateQueries({
        predicate: (q: any) => String(q.queryHash).includes("admin."),
      });
      setReason("");
      onClose();
    },
    onError: (err: any) => toast.error(err.message || "Failed to suspend"),
  });

  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Suspend marketplace visibility</DialogTitle>
          <DialogDescription>
            <span className="font-semibold">{target?.name}</span> will disappear
            from operator marketplace searches immediately. Active contracts and
            trip assignments are not affected.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 py-2">
          <Label htmlFor="suspend-reason">Reason (sent to the driver)</Label>
          <Textarea
            id="suspend-reason"
            rows={3}
            maxLength={1000}
            placeholder="e.g. Repeated safety complaints under review…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={reason.trim().length < 3 || mutation.isPending}
            onClick={() =>
              target &&
              mutation.mutate({
                driverProfileId: target.id,
                action: "SUSPEND",
                reason: reason.trim(),
              })
            }
          >
            <Ban className="size-4" />
            Suspend & Notify
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Offers audit row (expandable timeline) ──────────────────────────────────

function OfferAuditRow({ offer }: { offer: any }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <TableRow
        className="cursor-pointer"
        onClick={() => setExpanded((e) => !e)}
      >
        <TableCell>
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="size-7 border border-slate-100">
              <AvatarImage src={offer.driverProfile.user.image ?? undefined} />
              <AvatarFallback className="text-[9px]">
                {(offer.driverProfile.user.fullName ?? "DR")
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">
                {offer.driverProfile.user.fullName ?? "—"}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {offer.company.name}
              </p>
            </div>
          </div>
        </TableCell>
        <TableCell className="text-xs">
          {offer.currentSalaryCFA.toLocaleString("fr-FR")} FCFA
          {offer.currentSalaryCFA !== offer.initialSalaryCFA && (
            <span className="ml-1 text-[10px] text-slate-400 line-through">
              {offer.initialSalaryCFA.toLocaleString("fr-FR")}
            </span>
          )}
        </TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className={cn("text-[10px]", OFFER_STATUS_BADGES[offer.status])}
          >
            {offer.status}
          </Badge>
        </TableCell>
        <TableCell className="text-xs text-slate-500">
          {format(new Date(offer.createdAt), "dd MMM HH:mm")}
        </TableCell>
        <TableCell className="text-xs text-slate-500">
          {offer.respondedAt
            ? format(new Date(offer.respondedAt), "dd MMM HH:mm")
            : "—"}
        </TableCell>
        <TableCell className="w-8">
          {expanded ? (
            <ChevronUp className="size-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-3.5 text-muted-foreground" />
          )}
        </TableCell>
      </TableRow>

      {expanded && (
        <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
          <TableCell colSpan={6}>
            <div className="pl-2 py-1 space-y-1.5">
              {offer.events.map((ev: any) => (
                <div key={ev.id} className="flex items-start gap-2 text-xs">
                  <span className="mt-1 size-1.5 rounded-full bg-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-slate-700">
                      {EVENT_LABELS[ev.eventType] ?? ev.eventType}
                    </span>
                    <span className="text-slate-400 ml-1.5">
                      ({ev.actorType.toLowerCase()}) ·{" "}
                      {format(new Date(ev.createdAt), "dd MMM yyyy HH:mm")}
                      {ev.salaryCFA != null &&
                        ` · ${ev.salaryCFA.toLocaleString("fr-FR")} FCFA`}
                    </span>
                    {ev.note && (
                      <p className="text-slate-500 italic mt-0.5">
                        “{ev.note}”
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ─── Main View ───────────────────────────────────────────────────────────────

type DriverFilter =
  | "ALL"
  | "AVAILABLE"
  | "FEATURED"
  | "SUSPENDED"
  | "OFF_MARKET";

export function AdminMarketplaceView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Health strip
  const healthQuery = useQuery(trpc.admin.getMarketplaceHealth.queryOptions());

  // Drivers tab state
  const [driverTab, setDriverTab] = useState<DriverFilter>("ALL");
  const [driverSearch, setDriverSearch] = useState("");
  const [page, setPage] = useState(1);
  const [suspendTarget, setSuspendTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const driversQuery = useQuery({
    ...trpc.admin.listMarketplaceAdminDrivers.queryOptions({
      status: driverTab,
      search: driverSearch.trim() || undefined,
      page,
      limit: 20,
    }),
    enabled: true,
  });

  // Offers tab state
  const [offerStatus, setOfferStatus] = useState<any>("ALL");
  const [offerSearch, setOfferSearch] = useState("");
  const offersQuery = useQuery({
    ...trpc.admin.listAllOffers.queryOptions({
      status: offerStatus,
      search: offerSearch.trim() || undefined,
      page: 1,
      limit: 15,
    }),
  });

  function invalidateMarketplace() {
    queryClient.invalidateQueries({
      predicate: (q: any) =>
        String(q.queryHash).includes("listMarketplaceAdminDrivers") ||
        String(q.queryHash).includes("getMarketplaceHealth"),
    });
  }

  const toggleMutation = useMutation({
    ...trpc.admin.setDriverMarketplaceStatus.mutationOptions(),
    onSuccess: (_d, vars) => {
      toast.success(
        vars.action === "FEATURE"
          ? "Driver featured — notification sent"
          : vars.action === "UNFEATURE"
            ? "Driver removed from featured"
            : vars.action === "RESTORE"
              ? "Driver restored to the marketplace"
              : "Suspension updated",
      );
      invalidateMarketplace();
    },
    onError: (err: any) => toast.error(err.message || "Action failed"),
  });

  const health = healthQuery.data;
  const drivers = driversQuery.data?.items ?? [];
  const offers = offersQuery.data?.items ?? [];

  const DRIVER_FILTERS: Array<{ value: DriverFilter; label: string }> = [
    { value: "ALL", label: "All Verified" },
    { value: "AVAILABLE", label: "Available" },
    {
      value: "FEATURED",
      label: `Featured${health ? ` (${health.featured}/${health.maxFeatured})` : ""}`,
    },
    {
      value: "SUSPENDED",
      label: `Suspended${health ? ` (${health.suspended})` : ""}`,
    },
    { value: "OFF_MARKET", label: "Off Market" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <Store className="size-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Driver Marketplace Control
          </h1>
          <p className="text-sm text-muted-foreground">
            Platform-wide marketplace health, featuring, suspensions, and the
            full employment-offer audit log.
          </p>
        </div>
      </div>

      {/* Health strip */}
      {healthQuery.isLoading || !health ? (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard
              label="Verified Drivers"
              value={health.totalVerified}
              icon={Users}
              accent="text-blue-500"
            />
            <KpiCard
              label="Available"
              value={health.availableForHire}
              icon={Eye}
              accent="text-emerald-500"
            />
            <KpiCard
              label="Featured"
              value={`${health.featured}/${health.maxFeatured}`}
              icon={Sparkles}
              accent="text-amber-500"
            />
            <KpiCard
              label="Suspended"
              value={health.suspended}
              icon={Ban}
              accent="text-rose-500"
            />
            <KpiCard
              label="Employed"
              value={health.employed}
              icon={Briefcase}
              accent="text-violet-500"
            />
            <KpiCard
              label="Avg Time-to-Hire"
              value={
                health.avgTimeToHireHours != null
                  ? `${Math.round(health.avgTimeToHireHours)}h`
                  : "—"
              }
              icon={Clock}
              accent="text-cyan-600"
              sub={`Counter rate ${health.counterRatePct}%`}
            />
          </div>

          {/* Offer funnel */}
          <div className="rounded-xl border bg-white px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Offer Funnel
            </span>
            {Object.entries(health.funnel).map(([status, count]) => (
              <span
                key={status}
                className="inline-flex items-center gap-1.5 text-xs"
              >
                <span
                  className={cn(
                    "size-2 rounded-full",
                    status === "ACCEPTED" && "bg-emerald-500",
                    status === "PENDING" && "bg-amber-500",
                    status === "COUNTERED" && "bg-blue-500",
                    status === "DECLINED" && "bg-rose-500",
                    status === "EXPIRED" && "bg-zinc-400",
                    status === "WITHDRAWN" && "bg-slate-300",
                  )}
                />
                <span className="font-semibold">{count}</span>
                <span className="text-slate-400 capitalize">
                  {status.toLowerCase()}
                </span>
              </span>
            ))}
            <span className="ml-auto text-[11px] text-slate-400">
              Avg first response:{" "}
              <strong className="text-slate-600">
                {health.avgFirstResponseHours != null
                  ? `${Math.round(health.avgFirstResponseHours)}h`
                  : "—"}
              </strong>
            </span>
          </div>
        </>
      )}

      {/* Content tabs */}
      <Tabs defaultValue="drivers">
        <TabsList>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="offers">Offers Audit</TabsTrigger>
        </TabsList>

        {/* ── DRIVERS TAB ── */}
        <TabsContent value="drivers" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {DRIVER_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  setDriverTab(f.value);
                  setPage(1);
                }}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-colors",
                  driverTab === f.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300",
                )}
              >
                {f.label}
              </button>
            ))}
            <div className="relative ml-auto w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Name, phone, license…"
                className="pl-8 h-9 text-xs"
                value={driverSearch}
                onChange={(e) => {
                  setDriverSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>Traffic Lights</TableHead>
                  <TableHead>Badges</TableHead>
                  <TableHead>Affiliations</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {driversQuery.isLoading &&
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(5)].map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-24" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                {!driversQuery.isLoading && drivers.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-10 text-sm text-muted-foreground"
                    >
                      No drivers match this filter.
                    </TableCell>
                  </TableRow>
                )}
                {drivers.map((d: any) => {
                  const pref = d.preference;
                  const isLive = pref?.isAvailableForHire && !pref?.isSuspended;
                  return (
                    <TableRow key={d.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar className="size-8 border border-slate-100">
                            <AvatarImage src={d.image ?? undefined} />
                            <AvatarFallback className="text-[9px]">
                              {(d.fullName ?? "DR").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate">
                              {d.fullName ?? "—"}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Class {d.licenseCategory} ·{" "}
                              <span className="inline-flex items-center gap-0.5">
                                <Star className="size-2.5 fill-amber-400 text-amber-400" />
                                {d.averageRating.toFixed(1)}
                              </span>{" "}
                              · Safety {d.safetyScore}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {pref?.isFeatured && (
                            <Badge
                              className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 text-[10px]"
                              variant="outline"
                            >
                              <Sparkles className="size-2.5 mr-0.5" /> Featured
                            </Badge>
                          )}
                          {pref?.isSuspended && (
                            <Badge
                              className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50 text-[10px]"
                              variant="outline"
                            >
                              <Ban className="size-2.5 mr-0.5" /> Suspended
                            </Badge>
                          )}
                          {isLive && !pref?.isFeatured && (
                            <Badge
                              className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-[10px]"
                              variant="outline"
                            >
                              Available
                            </Badge>
                          )}
                          {!pref?.isAvailableForHire && !pref?.isSuspended && (
                            <Badge
                              variant="outline"
                              className="text-[10px] text-slate-400"
                            >
                              Off market
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <TrustBadges badges={d.trustBadges} size="xs" />
                      </TableCell>
                      <TableCell className="text-xs font-semibold">
                        {d.activeAffiliations}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {d.verificationStatus !== "VERIFIED" ? null : (
                            <>
                              {!pref?.isFeatured ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-[11px] gap-1"
                                  disabled={toggleMutation.isPending}
                                  onClick={() =>
                                    toggleMutation.mutate({
                                      driverProfileId: d.id,
                                      action: "FEATURE",
                                    })
                                  }
                                >
                                  <Sparkles className="size-3 text-amber-500" />
                                  Feature
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-[11px] gap-1"
                                  disabled={toggleMutation.isPending}
                                  onClick={() =>
                                    toggleMutation.mutate({
                                      driverProfileId: d.id,
                                      action: "UNFEATURE",
                                    })
                                  }
                                >
                                  Unfeature
                                </Button>
                              )}

                              {!pref?.isSuspended ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-[11px] gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                  onClick={() =>
                                    setSuspendTarget({
                                      id: d.id,
                                      name: d.fullName ?? "this driver",
                                    })
                                  }
                                >
                                  <ShieldAlert className="size-3" />
                                  Suspend
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-[11px] gap-1"
                                  disabled={toggleMutation.isPending}
                                  onClick={() =>
                                    toggleMutation.mutate({
                                      driverProfileId: d.id,
                                      action: "RESTORE",
                                    })
                                  }
                                >
                                  <RotateCcw className="size-3" />
                                  Restore
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Load more */}
          {(driversQuery.data?.total ?? 0) > page * 20 && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
              >
                Load more ({(driversQuery.data?.total ?? 0) - page * 20}{" "}
                remaining)
              </Button>
            </div>
          )}
        </TabsContent>

        {/* ── OFFERS AUDIT TAB ── */}
        <TabsContent value="offers" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              "ALL",
              "ACTIVE",
              "PENDING",
              "COUNTERED",
              "ACCEPTED",
              "DECLINED",
              "EXPIRED",
              "WITHDRAWN",
            ].map((s) => (
              <button
                key={s}
                onClick={() => setOfferStatus(s)}
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] font-semibold border transition-colors capitalize",
                  offerStatus === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300",
                )}
              >
                {s.toLowerCase()}
              </button>
            ))}
            <div className="relative ml-auto w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Company or driver…"
                className="pl-8 h-9 text-xs"
                value={offerSearch}
                onChange={(e) => setOfferSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver / Company</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Responded</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-10 text-sm text-muted-foreground"
                    >
                      No offers found.
                    </TableCell>
                  </TableRow>
                )}
                {offers.map((o: any) => (
                  <OfferAuditRow key={o.id} offer={o} />
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <SuspendDialog
        target={suspendTarget}
        onClose={() => setSuspendTarget(null)}
      />
    </div>
  );
}
