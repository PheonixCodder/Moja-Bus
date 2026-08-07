"use client";

import type { OperatorBookingFilter } from "@moja/types";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, ScanLine, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryStates } from "nuqs";
import { Suspense } from "react";
import { toast } from "sonner";
import { BookingDetailDrawer } from "@/features/operator/components/bookings/booking-detail-drawer";
import { BookingsList } from "@/features/operator/components/bookings/bookings-list";
import {
  TicketScanner,
  type TicketScanResult,
} from "@/features/operator/components/ticket-scanner";
import { useStaffPermissions } from "@/features/operator/hooks/use-staff-permissions";
import { useDebounce } from "@/features/operator/hooks/useDebounce";
import { bookingListParsers } from "@/features/operator/lib/bookings/booking-search-params";
import { useTRPC } from "@/trpc/client";

const PAGE_SIZE = 50;

const FILTERS: { id: OperatorBookingFilter; labelKey: string }[] = [
  { id: "today", labelKey: "filters.today" },
  { id: "upcoming", labelKey: "filters.upcoming" },
  { id: "past", labelKey: "filters.past" },
];

export function OperatorBookingsView() {
  const t = useTranslations("operatorDashboard.bookings");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { can, canAny } = useStaffPermissions();
  const canCheckIn = canAny(["bookings:update", "bookings:checkin"]);
  const [params, setParams] = useQueryStates(bookingListParsers);
  const { filter, q, status, tripId, page, detail } = params;
  const debouncedQ = useDebounce(q, 300);

  const checkInMutation = useMutation(
    trpc.operator.checkInBooking.mutationOptions({
      onSuccess: (result) => {
        void queryClient.invalidateQueries(
          trpc.operator.listBookings.pathFilter(),
        );
        if (result.alreadyCheckedIn) {
          toast.info(
            t("toast.alreadyCheckedIn", { name: result.passengerName }),
          );
        } else {
          toast.success(t("toast.checkedIn", { name: result.passengerName }));
        }
      },
      onError: (err) => {
        toast.error(err.message || t("toast.checkInFailed"));
      },
    }),
  );

  async function handleCheckIn(bookingId: string) {
    await checkInMutation.mutateAsync({ bookingId });
  }

  async function handleScan(raw: string): Promise<TicketScanResult> {
    const result = await checkInMutation.mutateAsync({ ticketToken: raw });
    void queryClient.invalidateQueries(trpc.operator.listBookings.pathFilter());
    return result;
  }

  const listInput = {
    filter,
    search: debouncedQ.trim() || undefined,
    status: status === "ALL" ? undefined : status,
    tripId: tripId || undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("title")}</h1>
          <p className="text-sm text-text-secondary mt-1">{t("description")}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {can("revenue:export") && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={async () => {
                try {
                  const result = await queryClient.fetchQuery(
                    trpc.operator.exportBookingsCsv.queryOptions({
                      ...listInput,
                      limit: 100,
                      offset: 0,
                    }),
                  );
                  const blob = new Blob([result.csv], {
                    type: "text/csv;charset=utf-8",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `bookings-${filter}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success(t("toast.exported", { count: result.count }));
                } catch (err: unknown) {
                  const message =
                    err instanceof Error
                      ? err.message
                      : t("toast.exportFailed");
                  toast.error(message);
                }
              }}
            >
              <Download className="size-4" />
              {t("exportCsv")}
            </Button>
          )}
          {canCheckIn ? (
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => void setParams({ detail: "scan" })}
            >
              <ScanLine className="size-4" />
              {t("scanTicket")}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <Button
            key={item.id}
            size="sm"
            variant={filter === item.id ? "default" : "outline"}
            onClick={() => void setParams({ filter: item.id, page: 1 })}
          >
            {t(item.labelKey)}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { id: "ALL", labelKey: "allStatuses" },
            { id: "CONFIRMED", labelKey: "status.CONFIRMED" },
            { id: "PENDING_PAYMENT", labelKey: "status.PENDING_PAYMENT" },
            { id: "CANCELLED", labelKey: "status.CANCELLED" },
            { id: "EXPIRED", labelKey: "status.EXPIRED" },
            { id: "COMPLETED", labelKey: "status.COMPLETED" },
          ] as const
        ).map((item) => (
          <Button
            key={item.id}
            size="sm"
            variant={status === item.id ? "secondary" : "ghost"}
            className="h-7 text-xs"
            onClick={() => void setParams({ status: item.id, page: 1 })}
          >
            {t(item.labelKey)}
          </Button>
        ))}
        {tripId ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-slate-50 px-2.5 py-1 text-xs">
            <span className="text-muted-foreground">{t("trip")}</span>
            <span className="font-mono font-semibold">{tripId}</span>
            <button
              type="button"
              onClick={() => void setParams({ tripId: "", page: 1 })}
              className="ml-0.5 text-muted-foreground hover:text-foreground"
              aria-label={t("clearTripFilter")}
            >
              ×
            </button>
          </span>
        ) : null}
        {status !== "ALL" || tripId ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-muted-foreground"
            onClick={() =>
              void setParams({ status: "ALL", tripId: "", page: 1 })
            }
          >
            {t("clearFilters")}
          </Button>
        ) : null}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-muted" />
          <Input
            value={q}
            onChange={(e) => void setParams({ q: e.target.value, page: 1 })}
            placeholder={t("searchPlaceholder")}
            className="pl-9"
          />
        </div>
      </div>

      <Suspense
        key={JSON.stringify(listInput)}
        fallback={
          <div className="flex justify-center py-16">
            <Spinner className="size-6 text-primary" />
          </div>
        }
      >
        <BookingsList
          listInput={listInput}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={(next) => void setParams({ page: next })}
          onCheckIn={canCheckIn ? handleCheckIn : undefined}
          onViewDetail={(b) => void setParams({ detail: b.id })}
          checkingInId={
            checkInMutation.isPending && checkInMutation.variables?.bookingId
              ? checkInMutation.variables.bookingId
              : null
          }
        />
      </Suspense>

      {detail && detail !== "scan" ? (
        <BookingDetailDrawer
          bookingId={detail}
          open
          onClose={() => void setParams({ detail: "" })}
        />
      ) : null}

      <TicketScanner
        open={detail === "scan"}
        onOpenChange={(open) => {
          if (!open) void setParams({ detail: "" });
        }}
        onScan={handleScan}
      />
    </div>
  );
}

export function OperatorBookingsViewFallback() {
  return (
    <div className="flex justify-center py-24">
      <Spinner className="size-6 text-primary" />
    </div>
  );
}
