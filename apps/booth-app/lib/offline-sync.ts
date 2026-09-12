/**
 * Offline Sync Handler — Phase 6
 *
 * Called every time the app detects a reconnection (offline → online).
 * Flushes queued cash sales from the offline queue, reporting
 * urban conflicts to the ERP when seats are already taken.
 */

import Toast from "react-native-toast-message";
import { useOfflineQueue } from "@/stores/offline-queue";

const MAX_HOLD_AGE_MS = 90 * 60 * 1000;

export type CreateCashSaleResult = {
  bookingId: string;
  boothSaleId?: string;
  confirmed?: boolean;
};

type CreateCashSaleFn = (input: {
  tripId: string;
  terminalId: string;
  destinationTerminalId: string;
  holdId?: string;
  seatIds?: string[];
  passengerCount?: number;
  passengerId: string;
  passengerName: string;
  passengerEmail: string;
  passengerPhone?: string;
  cashAmountXOF: number;
  wasOffline: boolean;
  walkedUpPassenger: boolean;
  passengerAccountCreated: boolean;
}) => Promise<CreateCashSaleResult | unknown>;

type ReportUrbanConflictFn = (input: {
  tripId: string;
  boothSaleIds: string[];
  excessCount: number;
}) => Promise<unknown>;

export async function flushOfflineQueue(
  createCashSale: CreateCashSaleFn,
  reportUrbanConflict: ReportUrbanConflictFn,
): Promise<{ flushed: number; conflicts: number; failed: number }> {
  const currentState = useOfflineQueue.getState();
  if (currentState.syncStatus === "syncing") {
    return { flushed: 0, conflicts: 0, failed: 0 };
  }

  const {
    queue,
    dequeue,
    markAttempt,
    setSyncStatus,
    setConflictCount,
    setLastSyncAt,
  } = currentState;

  if (queue.length === 0) {
    setSyncStatus("done");
    return { flushed: 0, conflicts: 0, failed: 0 };
  }

  setSyncStatus("syncing");
  let flushed = 0;
  let conflicts = 0;
  let failed = 0;

  for (const entry of queue) {
    const age = Date.now() - new Date(entry.queuedAt).getTime();
    if (age > MAX_HOLD_AGE_MS) {
      markAttempt(entry.id, "Hold expired — too old to sync");
      failed++;
      continue;
    }

    try {
      await createCashSale({
        tripId: entry.tripId,
        terminalId: entry.terminalId,
        destinationTerminalId: entry.destinationTerminalId,
        holdId: entry.holdId,
        passengerId: entry.passengerId,
        passengerName: entry.passengerName,
        passengerEmail: entry.passengerEmail,
        passengerPhone: entry.passengerPhone ?? undefined,
        cashAmountXOF: entry.cashAmountXOF,
        wasOffline: true,
        walkedUpPassenger: entry.walkedUpPassenger,
        passengerAccountCreated: entry.passengerAccountCreated,
        passengerCount: !entry.isIntercity ? entry.passengerCount : undefined,
        seatIds: entry.isIntercity ? [entry.seatId] : undefined,
      });
      dequeue(entry.id);
      flushed++;
    } catch (e: unknown) {
      const errorMsg = (e as { message?: string })?.message ?? "Unknown error";

      if (errorMsg.includes("CONFLICT") || errorMsg.includes("expired")) {
        conflicts++;
        markAttempt(entry.id, errorMsg);
        Toast.show({
          type: "error",
          text1: `Conflit : Siège ${entry.seatLabel}`,
          text2: `${entry.passengerName} — veuillez resélectionner`,
          visibilityTime: 6000,
        });
      } else {
        markAttempt(entry.id, errorMsg);
        failed++;
      }
    }
  }

  const conflictEntries = useOfflineQueue
    .getState()
    .queue.filter((e) => e.lastError?.includes("CONFLICT"));

  const byTrip = conflictEntries.reduce<Record<string, typeof conflictEntries>>(
    (acc, e) => {
      const holds = acc[e.tripId] ?? [];
      holds.push(e);
      acc[e.tripId] = holds;
      return acc;
    },
    {},
  );

  for (const [tripId, entries] of Object.entries(byTrip)) {
    if (!entries[0]?.isIntercity) {
      try {
        await reportUrbanConflict({
          tripId,
          boothSaleIds: entries.map((e) => e.holdId),
          excessCount: entries.length,
        });
      } catch {
        // Non-critical — ERP notification failed, booth still shows banner
      }
    }
  }

  setConflictCount(conflicts);
  setSyncStatus(conflicts + failed > 0 ? "failed" : "done");
  setLastSyncAt(new Date().toISOString());

  return { flushed, conflicts, failed };
}
