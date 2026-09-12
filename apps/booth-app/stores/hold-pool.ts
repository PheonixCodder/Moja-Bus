/**
 * Hold Pool Store — Phase 6
 *
 * Zustand store for offline seat reservations.
 * When the booth loses network connectivity, pre-acquired seat holds
 * are cached here so staff can continue selling intercity tickets.
 * Each hold has an expiry (default 90 min server-side TTL).
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface PoolHold {
  holdId: string;
  seatId: string;
  seatLabel: string;
  expiresAt: string;
  consumed: boolean;
}

export interface TripHoldPool {
  tripId: string;
  holds: PoolHold[];
  lastRefreshed: string;
}

interface HoldPoolState {
  pools: Record<string, TripHoldPool>;

  setPool: (tripId: string, holds: Omit<PoolHold, "consumed">[]) => void;
  consumeHold: (tripId: string, holdId: string) => void;
  releaseHold: (tripId: string, holdId: string) => void;
  pruneExpiredHolds: (tripId?: string) => void;
  getAvailableHolds: (tripId: string) => PoolHold[];
  getAvailableForTrip: (tripId: string) => PoolHold[];
  getConsumedHolds: (tripId: string) => PoolHold[];
  getAllUnconsumedHoldIds: () => string[];
  clearPool: (tripId: string) => void;
  clearAllPools: () => void;
  isHoldExpired: (hold: PoolHold) => boolean;
}

export const useHoldPoolStore = create<HoldPoolState>()(
  persist(
    (set, get) => ({
      pools: {},

      setPool: (tripId, holds) =>
        set((state) => ({
          pools: {
            ...state.pools,
            [tripId]: {
              tripId,
              holds: holds.map((h) => ({ ...h, consumed: false })),
              lastRefreshed: new Date().toISOString(),
            },
          },
        })),

      consumeHold: (tripId, holdId) =>
        set((state) => {
          const pool = state.pools[tripId];
          if (!pool) return state;
          return {
            pools: {
              ...state.pools,
              [tripId]: {
                ...pool,
                holds: pool.holds.map((h) =>
                  h.holdId === holdId ? { ...h, consumed: true } : h,
                ),
              },
            },
          };
        }),

      releaseHold: (tripId, holdId) =>
        set((state) => {
          const pool = state.pools[tripId];
          if (!pool) return state;
          return {
            pools: {
              ...state.pools,
              [tripId]: {
                ...pool,
                holds: pool.holds.map((h) =>
                  h.holdId === holdId ? { ...h, consumed: false } : h,
                ),
              },
            },
          };
        }),

      pruneExpiredHolds: (tripId) =>
        set((state) => {
          const now = new Date();
          const targetPools = tripId
            ? { [tripId]: state.pools[tripId] }
            : state.pools;

          const updated: Record<string, TripHoldPool> = { ...state.pools };
          for (const [id, pool] of Object.entries(targetPools)) {
            if (!pool) continue;
            updated[id] = {
              ...pool,
              holds: pool.holds.filter(
                (h) => !h.consumed && new Date(h.expiresAt) > now,
              ),
            };
          }
          return { pools: updated };
        }),

      getAvailableHolds: (tripId) => {
        return get().getAvailableForTrip(tripId);
      },

      getAvailableForTrip: (tripId) => {
        const pool = get().pools[tripId];
        if (!pool) return [];
        const now = new Date();
        return pool.holds.filter(
          (h) => !h.consumed && new Date(h.expiresAt) > now,
        );
      },

      getConsumedHolds: (tripId) => {
        const pool = get().pools[tripId];
        if (!pool) return [];
        return pool.holds.filter((h) => h.consumed);
      },

      getAllUnconsumedHoldIds: () => {
        const pools = get().pools;
        const now = new Date();
        return Object.values(pools)
          .flatMap((pool) => pool.holds)
          .filter((h) => !h.consumed && new Date(h.expiresAt) > now)
          .map((h) => h.holdId);
      },

      clearPool: (tripId) =>
        set((state) => {
          const { [tripId]: _, ...rest } = state.pools;
          return { pools: rest };
        }),

      clearAllPools: () => set({ pools: {} }),

      isHoldExpired: (hold) => new Date(hold.expiresAt) <= new Date(),
    }),
    {
      name: "booth-hold-pool",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
