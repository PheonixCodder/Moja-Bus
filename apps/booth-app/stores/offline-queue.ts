/**
 * Offline Queue Store — Phase 6
 *
 * Zustand store for cash sales queued while offline.
 * Each entry represents a completed ticket sale that needs to be
 * synced to the server when connectivity is restored.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface OfflineQueueEntry {
  id: string;
  tripId: string;
  holdId: string;
  seatId: string;
  seatLabel: string;
  terminalId: string;
  destinationTerminalId: string;
  passengerId: string;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string | null;
  cashAmountXOF: number;
  walkedUpPassenger: boolean;
  passengerAccountCreated: boolean;
  isIntercity: boolean;
  passengerCount: number;
  queuedAt: string;
  attempts: number;
  lastError: string | null;
}

type SyncStatus = "idle" | "syncing" | "done" | "failed";

interface OfflineQueueState {
  queue: OfflineQueueEntry[];
  syncStatus: SyncStatus;
  lastSyncAt: string | null;
  conflictCount: number;

  enqueue: (
    entry: Omit<
      OfflineQueueEntry,
      "id" | "queuedAt" | "attempts" | "lastError"
    >,
  ) => void;
  dequeue: (id: string) => void;
  markAttempt: (id: string, error?: string) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setLastSyncAt: (date: string) => void;
  setConflictCount: (count: number) => void;
  retryEntry: (id: string) => void;
  clearQueue: () => void;
}

export const useOfflineQueue = create<OfflineQueueState>()(
  persist(
    (set) => ({
      queue: [],
      syncStatus: "idle",
      lastSyncAt: null,
      conflictCount: 0,

      enqueue: (entry) =>
        set((state) => ({
          queue: [
            ...state.queue,
            {
              ...entry,
              id: `offline-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              queuedAt: new Date().toISOString(),
              attempts: 0,
              lastError: null,
            },
          ],
        })),

      dequeue: (id) =>
        set((state) => ({
          queue: state.queue.filter((e) => e.id !== id),
        })),

      markAttempt: (id, error) =>
        set((state) => ({
          queue: state.queue.map((e) =>
            e.id === id
              ? {
                  ...e,
                  attempts: e.attempts + 1,
                  lastError: error ?? null,
                }
              : e,
          ),
        })),

      retryEntry: (id) =>
        set((state) => ({
          queue: state.queue.map((e) =>
            e.id === id
              ? {
                  ...e,
                  attempts: 0,
                  lastError: null,
                }
              : e,
          ),
        })),

      setSyncStatus: (syncStatus) =>
        set((state) => ({
          syncStatus,
          lastSyncAt:
            syncStatus === "done" ? new Date().toISOString() : state.lastSyncAt,
        })),

      setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),

      setConflictCount: (conflictCount) => set({ conflictCount }),

      clearQueue: () => set({ queue: [], conflictCount: 0 }),
    }),
    {
      name: "booth-offline-queue",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/** Granular selectors for offline queue */
export const selectOfflineQueueLength = (state: OfflineQueueState) =>
  state.queue.length;

export const selectSyncStatus = (state: OfflineQueueState) => state.syncStatus;

export const selectConflictCount = (state: OfflineQueueState) =>
  state.conflictCount;

export const selectLastSyncAt = (state: OfflineQueueState) => state.lastSyncAt;
