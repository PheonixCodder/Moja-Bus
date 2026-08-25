"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@moja/ui/components/ui/avatar";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { Skeleton } from "@moja/ui/components/ui/skeleton";
import { Textarea } from "@moja/ui/components/ui/textarea";
import { cn } from "@moja/ui/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  BadgeCheck,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  Loader2,
  RefreshCw,
  Send,
  ShieldCheck,
  Star,
} from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryStates } from "nuqs";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

// ─── URL state ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const sentOffersSearchParams = {
  status: parseAsString.withDefault("ACTIVE"),
};

type OfferStatus =
  | "PENDING"
  | "COUNTERED"
  | "ACCEPTED"
  | "DECLINED"
  | "EXPIRED"
  | "WITHDRAWN";

const STATUS_TABS: Array<{ value: string; label: string }> = [
  { value: "ACTIVE", label: "Active" },
  { value: "PENDING", label: "Pending" },
  { value: "COUNTERED", label: "Countered" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "DECLINED", label: "Declined" },
  { value: "EXPIRED", label: "Expired" },
  { value: "WITHDRAWN", label: "Withdrawn" },
];

const STATUS_BADGES: Record<OfferStatus, { label: string; className: string }> =
  {
    PENDING: {
      label: "Pending",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    COUNTERED: {
      label: "Countered",
      className: "bg-blue-50 text-blue-700 border-blue-200",
    },
    ACCEPTED: {
      label: "Accepted",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    DECLINED: {
      label: "Declined",
      className: "bg-rose-50 text-rose-700 border-rose-200",
    },
    EXPIRED: {
      label: "Expired",
      className: "bg-zinc-100 text-zinc-600 border-zinc-200",
    },
    WITHDRAWN: {
      label: "Withdrawn",
      className: "bg-slate-100 text-slate-500 border-slate-200",
    },
  };

const EMPLOYMENT_LABELS: Record<string, string> = {
  EXCLUSIVE_INTERCITY: "Exclusive Intercity",
  CONTRACTOR_URBAN: "Contractor Urban",
  HYBRID: "Hybrid",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function expiryCountdown(expiresAt: Date | string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "expired";
  const hours = Math.floor(ms / (60 * 60 * 1000));
  if (hours < 48) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
}

function SentOfferSkeleton() {
  return (
    <div className="rounded-2xl border bg-white p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-16 w-full rounded-xl" />
    </div>
  );
}

// ─── Counter-back inline form ────────────────────────────────────────────────

function CounterBackForm({
  offerId,
  onDone,
}: {
  offerId: string;
  onDone: () => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [salary, setSalary] = useState("");
  const [startDate, setStartDate] = useState("");
  const [note, setNote] = useState("");

  const mutation = useMutation({
    ...trpc.drivers.respondToCounterOffer.mutationOptions(),
    onSuccess: () => {
      toast.success("Counter-proposal sent to the driver");
      queryClient.invalidateQueries(trpc.drivers.listSentOffers.pathFilter());
      onDone();
    },
    onError: (err) => toast.error(err.message || "Failed to respond"),
  });

  const salaryNum = Number(salary.replace(/[^\d]/g, ""));

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-blue-200 bg-blue-50/50 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`cb-salary-${offerId}`}>Revised salary (FCFA)</Label>
          <Input
            id={`cb-salary-${offerId}`}
            type="number"
            min={1000}
            step={1000}
            placeholder="e.g. 265000"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`cb-date-${offerId}`}>Start date</Label>
          <Input
            id={`cb-date-${offerId}`}
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
      </div>
      <Textarea
        rows={2}
        maxLength={2000}
        placeholder="Message to the driver (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onDone}
          disabled={mutation.isPending}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={
            !Number.isFinite(salaryNum) ||
            salaryNum < 1000 ||
            mutation.isPending
          }
          onClick={() =>
            mutation.mutate({
              offerId,
              action: "COUNTER_BACK",
              newSalaryCFA: salaryNum,
              newStartDate: startDate || null,
              note: note.trim() || null,
            })
          }
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" /> Sending…
            </>
          ) : (
            "Send revised terms"
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Main View ───────────────────────────────────────────────────────────────

export function OperatorSentOffersView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [params] = useQueryStates(sentOffersSearchParams);
  const [page, setPage] = useState(1);
  const [counterBackOfferId, setCounterBackOfferId] = useState<string | null>(
    null,
  );

  const statusParam = params.status as
    | "ACTIVE"
    | "PENDING"
    | "COUNTERED"
    | "ACCEPTED"
    | "DECLINED"
    | "EXPIRED"
    | "WITHDRAWN";

  const offersQuery = useQuery(
    trpc.drivers.listSentOffers.queryOptions({
      status: statusParam,
      page,
      limit: PAGE_SIZE,
    }),
  );

  const withdrawMutation = useMutation({
    ...trpc.drivers.withdrawOffer.mutationOptions(),
    onSuccess: () => {
      toast.success("Offer withdrawn");
      queryClient.invalidateQueries(trpc.drivers.listSentOffers.pathFilter());
      queryClient.invalidateQueries(
        trpc.drivers.listMarketplaceDrivers.pathFilter(),
      );
    },
    onError: (err) => toast.error(err.message || "Failed to withdraw"),
  });

  const respondMutation = useMutation({
    ...trpc.drivers.respondToCounterOffer.mutationOptions(),
    onSuccess: (_, vars) => {
      toast.success(
        vars.action === "ACCEPT_COUNTER"
          ? "Counter accepted — affiliation created"
          : vars.action === "DECLINE_COUNTER"
            ? "Counter declined"
            : "Revised terms sent",
      );
      queryClient.invalidateQueries(trpc.drivers.listSentOffers.pathFilter());
      queryClient.invalidateQueries(trpc.drivers.listDrivers.pathFilter());
      setCounterBackOfferId(null);
    },
    onError: (err) => toast.error(err.message || "Failed to respond"),
  });

  // Phase 24 (F-OP-07) — accumulate pages (marketplace pattern): Load-more
  // APPENDS page batches instead of replacing the visible list.
  type SentOfferItem = NonNullable<typeof offersQuery.data>["items"][number];
  const [pageBatches, setPageBatches] = useState<SentOfferItem[][]>([]);
  const lastStatusKey = useRef(`status:${statusParam ?? ""}`);

  useEffect(() => {
    // Filter/tab change resets accumulation.
    const key = `status:${statusParam ?? ""}`;
    if (key !== lastStatusKey.current) {
      lastStatusKey.current = key;
      setPage(1);
      setPageBatches([]);
    }
  }, [statusParam]);

  useEffect(() => {
    const batch = offersQuery.data?.items;
    if (!batch || batch.length === 0) return;
    setPageBatches((prev) => {
      if (page === 1) return [batch];
      if (prev.length >= page) return prev; // this page already collected
      return [...prev, batch];
    });
  }, [offersQuery.data, page]);

  const items = (page === 1 ? pageBatches[0] : pageBatches.flat()) ?? [];
  const total = offersQuery.data?.total ?? 0;
  const hasMore = page * PAGE_SIZE < total;

  // Phase 24 — Load-more appends the next page batch.
  function loadMore() {
    setPage((p) => p + 1);
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          <Send className="size-7 text-primary" />
          Sent Offers
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track every employment offer — responses, counter-proposals, and
          expirations.
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={
              tab.value === "ACTIVE"
                ? "/dashboard/operator/drivers/offers"
                : `/dashboard/operator/drivers/offers?status=${tab.value}`
            }
          >
            <button
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-colors",
                params.status === tab.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300",
              )}
            >
              {tab.label}
            </button>
          </Link>
        ))}
      </div>

      {/* Loading skeletons */}
      {offersQuery.isLoading && (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <SentOfferSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!offersQuery.isLoading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="rounded-full bg-slate-100 p-5">
            <Send className="size-8 text-slate-400" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-700">No offers here</p>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              {statusParam === "ACTIVE"
                ? "You haven't sent any active offers. Browse the marketplace to recruit drivers."
                : `No ${STATUS_BADGES[statusParam as OfferStatus]?.label.toLowerCase() ?? ""} offers yet.`}
            </p>
          </div>
          <Link href="/dashboard/operator/drivers/marketplace">
            <Button className="gap-2">
              <Send className="size-4" />
              Browse Marketplace
            </Button>
          </Link>
        </div>
      )}

      {/* Offers list */}
      <div className="space-y-4">
        {items.map((offer: any) => {
          const badge = STATUS_BADGES[offer.status as OfferStatus];
          const isLive =
            offer.status === "PENDING" || offer.status === "COUNTERED";
          const countered = offer.status === "COUNTERED";
          const lastDriverEvent = offer.events?.find(
            (e: any) => e.actorType === "DRIVER" && e.eventType !== "VIEWED",
          );

          return (
            <div
              key={offer.id}
              className="rounded-2xl border bg-white shadow-sm p-5 space-y-4"
            >
              {/* Top row: driver + status */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="size-12 border-2 border-slate-100">
                    <AvatarImage
                      src={offer.driverProfile.user.image ?? undefined}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {(offer.driverProfile.user.fullName ?? "DR")
                        .split(" ")
                        .map((p: string) => p[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {offer.driverProfile.user.fullName ?? "—"}
                      </p>
                      {offer.hasBeenSeen && isLive && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                          <Eye className="size-2.5" />
                          Seen
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-xs text-slate-500">
                      <span className="font-semibold">
                        Class {offer.driverProfile.licenseCategory}
                      </span>
                      <span>{offer.driverProfile.yearsOfExperience} yrs</span>
                      <span className="inline-flex items-center gap-1">
                        <Star className="size-3 fill-amber-400 text-amber-400" />
                        {offer.driverProfile.averageRating.toFixed(1)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <ShieldCheck className="size-3 text-emerald-500" />
                        {offer.driverProfile.safetyScore}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold",
                      badge?.className,
                    )}
                  >
                    {badge?.label ?? offer.status}
                  </span>
                  {isLive && !offer.isExpiredDue && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-[11px] font-medium",
                        new Date(offer.expiresAt).getTime() - Date.now() <
                          24 * 3600 * 1000
                          ? "text-rose-600"
                          : "text-slate-400",
                      )}
                    >
                      <Clock className="size-3" />
                      {expiryCountdown(offer.expiresAt)}
                    </span>
                  )}
                </div>
              </div>

              {/* Terms block */}
              <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wide font-bold text-slate-400">
                    Employment Model
                  </p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">
                    {EMPLOYMENT_LABELS[offer.employmentType] ??
                      offer.employmentType}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide font-bold text-slate-400">
                    Monthly Salary
                  </p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {countered &&
                      offer.currentSalaryCFA !== offer.initialSalaryCFA && (
                        <span className="text-xs text-slate-400 line-through mr-1.5 font-medium">
                          {offer.initialSalaryCFA.toLocaleString("fr-FR")}
                        </span>
                      )}
                    {offer.currentSalaryCFA.toLocaleString("fr-FR")}{" "}
                    <span className="text-[11px] font-medium text-slate-500">
                      FCFA
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide font-bold text-slate-400">
                    Start Date
                  </p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5 inline-flex items-center gap-1">
                    <CalendarDays className="size-3.5 text-slate-400" />
                    {offer.currentStartDate
                      ? format(new Date(offer.currentStartDate), "dd MMM yyyy")
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Counter note */}
              {countered && lastDriverEvent?.note && (
                <p className="text-xs italic text-slate-600 bg-blue-50/60 border border-blue-100 rounded-lg px-3 py-2">
                  “{lastDriverEvent.note}”
                </p>
              )}

              {/* Actions */}
              {isLive && (
                <div className="flex flex-wrap justify-end gap-2 pt-1">
                  {countered && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() =>
                          respondMutation.mutate({
                            offerId: offer.id,
                            action: "DECLINE_COUNTER",
                          })
                        }
                        disabled={respondMutation.isPending}
                      >
                        Decline Counter
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() =>
                          setCounterBackOfferId(
                            counterBackOfferId === offer.id ? null : offer.id,
                          )
                        }
                      >
                        {counterBackOfferId === offer.id ? (
                          <>
                            <ChevronUp className="size-3.5" /> Hide Form
                          </>
                        ) : (
                          <>
                            <ChevronDown className="size-3.5" /> Counter Back
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() =>
                          respondMutation.mutate({
                            offerId: offer.id,
                            action: "ACCEPT_COUNTER",
                          })
                        }
                        disabled={respondMutation.isPending}
                      >
                        <BadgeCheck className="size-3.5" />
                        Accept Counter
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1.5"
                    onClick={() =>
                      withdrawMutation.mutate({ offerId: offer.id })
                    }
                    disabled={withdrawMutation.isPending}
                  >
                    Withdraw
                  </Button>
                </div>
              )}

              {countered && counterBackOfferId === offer.id && (
                <CounterBackForm
                  offerId={offer.id}
                  onDone={() => setCounterBackOfferId(null)}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Load more */}
      {!offersQuery.isLoading && hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={offersQuery.isFetching}
            className="gap-2 min-w-36"
          >
            {offersQuery.isFetching ? (
              <>
                <RefreshCw className="size-4 animate-spin" />
                Loading...
              </>
            ) : (
              `Load more (${total - items.length} remaining)`
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
