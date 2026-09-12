/**
 * useHoldPool — Phase 6
 *
 * React hook that wraps the hold pool store with server-side
 * pre-acquire and release mutations. Used by the seat map screen
 * to fetch and consume seat holds for offline intercity sales.
 */

import { useMutation } from "@tanstack/react-query";
import { useCallback } from "react";
import { useTRPC } from "@/lib/trpc";
import { type PoolHold, useHoldPoolStore } from "@/stores/hold-pool";

export function useHoldPool() {
  const trpc = useTRPC();
  const preAcquireMutation = useMutation(
    trpc.booth.preAcquireHolds.mutationOptions(),
  );
  const releaseHoldsMutation = useMutation(
    trpc.booth.releaseHolds.mutationOptions(),
  );

  const refreshPool = useCallback(
    async (tripId: string, terminalId: string) => {
      try {
        const result = await preAcquireMutation.mutateAsync({
          tripId,
          terminalId,
          count: 5,
        });
        const mapped = result.holds.map((h) => ({
          holdId: h.holdId,
          seatId: h.seatId,
          seatLabel: h.seatLabel,
          expiresAt: h.expiresAt.toISOString(),
        }));
        useHoldPoolStore.getState().setPool(tripId, mapped);
        return mapped;
      } catch (e) {
        console.warn("Failed to pre-acquire holds:", e);
        return [];
      }
    },
    [preAcquireMutation],
  );

  const releaseAllHolds = useCallback(async () => {
    const store = useHoldPoolStore.getState();
    const holdIds = store.getAllUnconsumedHoldIds();
    if (holdIds.length === 0) return;
    try {
      await releaseHoldsMutation.mutateAsync({ holdIds });
    } catch (e) {
      console.warn("Failed to release holds:", e);
    } finally {
      store.clearAllPools();
    }
  }, [releaseHoldsMutation]);

  const getAvailablePoolSeats = useCallback((tripId: string): PoolHold[] => {
    const store = useHoldPoolStore.getState();
    return store.getAvailableHolds(tripId).filter((h) => !store.isHoldExpired(h));
  }, []);

  const takeHoldForSale = useCallback(
    (tripId: string): PoolHold | null => {
      const available = getAvailablePoolSeats(tripId);
      if (available.length === 0) return null;
      const hold = available[0] ?? null;
      if (!hold) return null;
      useHoldPoolStore.getState().consumeHold(tripId, hold.holdId);
      return hold;
    },
    [getAvailablePoolSeats],
  );

  const poolExpiryWarning = useCallback(
    (tripId: string): boolean => {
      const available = getAvailablePoolSeats(tripId);
      return available.length < 2;
    },
    [getAvailablePoolSeats],
  );

  return {
    refreshPool,
    releaseAllHolds,
    getAvailablePoolSeats,
    takeHoldForSale,
    poolExpiryWarning,
    getConsumedHolds: (tripId: string) =>
      useHoldPoolStore.getState().getConsumedHolds(tripId),
  };
}
