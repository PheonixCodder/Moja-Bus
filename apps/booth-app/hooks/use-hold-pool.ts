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
  const {
    setPool,
    consumeHold,
    getAvailableHolds,
    getConsumedHolds,
    getAllUnconsumedHoldIds,
    clearAllPools,
    isHoldExpired,
  } = useHoldPoolStore();

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
        setPool(tripId, mapped);
        return mapped;
      } catch (e) {
        console.warn("Failed to pre-acquire holds:", e);
        return [];
      }
    },
    [preAcquireMutation, setPool],
  );

  const releaseAllHolds = useCallback(async () => {
    const holdIds = getAllUnconsumedHoldIds();
    if (holdIds.length === 0) return;
    try {
      await releaseHoldsMutation.mutateAsync({ holdIds });
    } catch (e) {
      console.warn("Failed to release holds:", e);
    } finally {
      clearAllPools();
    }
  }, [getAllUnconsumedHoldIds, releaseHoldsMutation, clearAllPools]);

  const getAvailablePoolSeats = useCallback(
    (tripId: string): PoolHold[] => {
      return getAvailableHolds(tripId).filter((h) => !isHoldExpired(h));
    },
    [getAvailableHolds, isHoldExpired],
  );

  const takeHoldForSale = useCallback(
    (tripId: string): PoolHold | null => {
      const available = getAvailablePoolSeats(tripId);
      if (available.length === 0) return null;
      const hold = available[0] ?? null;
      if (!hold) return null;
      consumeHold(tripId, hold.holdId);
      return hold;
    },
    [getAvailablePoolSeats, consumeHold],
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
    getConsumedHolds,
  };
}
