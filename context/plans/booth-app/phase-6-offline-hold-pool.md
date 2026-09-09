# Phase 6 — Offline Hold Pool

> **Status**: ✅ Complete  
> **Depends on**: Phase 5 (sell flow online)  
> **Blocks**: Nothing — but must be done before production

---

## Objective

Implement the complete offline system: hold pool store, offline queue, network status hook, offline sync handler, and the offline banner component. Wire the offline mode into the existing sell flow from Phase 5.

---

## 6.1 — `apps/booth-app/hooks/use-network-status.ts`

```typescript
import { useEffect, useState } from "react";
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";

export interface NetworkStatus {
  isOnline: boolean;
  isConnected: boolean | null;
  connectionType: string | null;
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: true,
    isConnected: null,
    connectionType: null,
  });

  useEffect(() => {
    // Get initial state
    NetInfo.fetch().then((state) => {
      setStatus({
        isOnline: !!(state.isConnected && state.isInternetReachable),
        isConnected: state.isConnected,
        connectionType: state.type,
      });
    });

    // Subscribe to changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setStatus({
        isOnline: !!(state.isConnected && state.isInternetReachable),
        isConnected: state.isConnected,
        connectionType: state.type,
      });
    });

    return unsubscribe;
  }, []);

  return status;
}
```

---

## 6.2 — `apps/booth-app/stores/hold-pool.ts`

```typescript
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface PoolHold {
  holdId: string;
  seatId: string;
  seatNumber: string;
  seatClass: string;
  expiresAt: string; // ISO string
  consumed: boolean;
}

export interface TripHoldPool {
  tripId: string;
  holds: PoolHold[];
  lastRefreshed: string; // ISO string
}

interface HoldPoolState {
  // Map of tripId → TripHoldPool
  pools: Record<string, TripHoldPool>;

  // Actions
  setPool: (tripId: string, holds: Omit<PoolHold, "consumed">[]) => void;
  consumeHold: (tripId: string, holdId: string) => void;
  getAvailableHolds: (tripId: string) => PoolHold[];
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

      getAvailableHolds: (tripId) => {
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
```

---

## 6.3 — `apps/booth-app/stores/offline-queue.ts`

```typescript
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface OfflineQueueEntry {
  id: string; // Local ID
  tripId: string;
  holdId: string; // Pre-acquired pool hold ID
  seatId: string;
  seatNumber: string;
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
  queuedAt: string; // ISO string
  attempts: number;
  lastError: string | null;
}

type SyncStatus = "idle" | "syncing" | "done" | "failed";

interface OfflineQueueState {
  queue: OfflineQueueEntry[];
  syncStatus: SyncStatus;
  lastSyncAt: string | null;
  conflictCount: number;

  enqueue: (entry: Omit<OfflineQueueEntry, "id" | "queuedAt" | "attempts" | "lastError">) => void;
  dequeue: (id: string) => void;
  markAttempt: (id: string, error?: string) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setConflictCount: (count: number) => void;
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
              ? { ...e, attempts: e.attempts + 1, lastError: error ?? null }
              : e,
          ),
        })),

      setSyncStatus: (syncStatus) => set({ syncStatus }),

      setConflictCount: (conflictCount) => set({ conflictCount }),

      clearQueue: () => set({ queue: [], conflictCount: 0 }),
    }),
    {
      name: "booth-offline-queue",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
```

---

## 6.4 — `apps/booth-app/hooks/use-hold-pool.ts`

```typescript
import { useCallback } from "react";
import { useHoldPoolStore, type PoolHold } from "@/stores/hold-pool";
import { useOfflineQueue } from "@/stores/offline-queue";
import { trpc } from "@/lib/trpc";

export function useHoldPool() {
  const {
    setPool, consumeHold, getAvailableHolds, getConsumedHolds,
    getAllUnconsumedHoldIds, clearAllPools, isHoldExpired,
  } = useHoldPoolStore();

  const preAcquireMutation = trpc.booth.preAcquireHolds.useMutation();
  const releaseHoldsMutation = trpc.booth.releaseHolds.useMutation();

  const refreshPool = useCallback(
    async (tripId: string, terminalId: string) => {
      try {
        const result = await preAcquireMutation.mutateAsync({
          tripId,
          terminalId,
          count: 5,
        });
        setPool(tripId, result.holds);
        return result.holds;
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
      const hold = available[0]!;
      consumeHold(tripId, hold.holdId);
      return hold;
    },
    [getAvailablePoolSeats, consumeHold],
  );

  const poolExpiryWarning = useCallback(
    (tripId: string): boolean => {
      const available = getAvailablePoolSeats(tripId);
      // Warning when < 2 seats left in pool
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
```

---

## 6.5 — `apps/booth-app/lib/offline-sync.ts`

Called every time the app detects a reconnection.

```typescript
import { useOfflineQueue } from "@/stores/offline-queue";
import { useHoldPoolStore } from "@/stores/hold-pool";
import { trpc } from "@/lib/trpc";
import Toast from "react-native-toast-message";

// Maximum hold age before giving up (90 minutes)
const MAX_HOLD_AGE_MS = 90 * 60 * 1000;

export async function flushOfflineQueue(
  createCashSale: ReturnType<typeof trpc.booth.createCashSale.useMutation>["mutateAsync"],
  releaseHolds: ReturnType<typeof trpc.booth.releaseHolds.useMutation>["mutateAsync"],
  reportUrbanConflict: ReturnType<typeof trpc.booth.reportUrbanConflict.useMutation>["mutateAsync"],
): Promise<{ flushed: number; conflicts: number; failed: number }> {
  const { queue, dequeue, markAttempt, setSyncStatus, setConflictCount } =
    useOfflineQueue.getState();

  if (queue.length === 0) return { flushed: 0, conflicts: 0, failed: 0 };

  setSyncStatus("syncing");
  let flushed = 0;
  let conflicts = 0;
  let failed = 0;

  for (const entry of queue) {
    // Skip entries older than max hold age — holds will have expired
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
        holdId: entry.holdId, // Use the pre-acquired hold
        passengerId: entry.passengerId,
        passengerName: entry.passengerName,
        passengerEmail: entry.passengerEmail,
        passengerPhone: entry.passengerPhone ?? undefined,
        cashAmountXOF: entry.cashAmountXOF,
        wasOffline: true, // Always true for queued entries
        walkedUpPassenger: entry.walkedUpPassenger,
        passengerAccountCreated: entry.passengerAccountCreated,
        passengerCount: !entry.isIntercity ? entry.passengerCount : undefined,
        seatIds: entry.isIntercity ? [entry.seatId] : undefined,
      });
      dequeue(entry.id);
      flushed++;
    } catch (e: any) {
      const errorMsg = e?.message ?? "Unknown error";

      if (errorMsg.includes("CONFLICT") || errorMsg.includes("expired")) {
        // Seat conflict — notify staff immediately
        conflicts++;
        markAttempt(entry.id, errorMsg);
        Toast.show({
          type: "error",
          text1: `Conflit : Siège ${entry.seatNumber}`,
          text2: `${entry.passengerName} — veuillez resélectionner`,
          visibilityTime: 6000,
        });
      } else {
        // Other error — keep in queue for next sync attempt
        markAttempt(entry.id, errorMsg);
        failed++;
      }
    }
  }

  // Report urban conflicts to ERP if any
  if (conflicts > 0) {
    const conflictEntries = useOfflineQueue
      .getState()
      .queue.filter((e) => e.lastError?.includes("CONFLICT"));

    // Group by tripId
    const byTrip = conflictEntries.reduce<Record<string, typeof conflictEntries>>(
      (acc, e) => {
        if (!acc[e.tripId]) acc[e.tripId] = [];
        acc[e.tripId]!.push(e);
        return acc;
      },
      {},
    );

    for (const [tripId, entries] of Object.entries(byTrip)) {
      if (!entries[0]?.isIntercity) {
        // Urban conflict — report to ERP
        try {
          await reportUrbanConflict({
            tripId,
            boothSaleIds: [], // Not yet created — report is advisory
            excessCount: entries.length,
          });
        } catch {
          // Non-critical — ERP notification failed, booth still shows banner
        }
      }
    }
  }

  setConflictCount(conflicts);
  setSyncStatus(conflicts + failed > 0 ? "failed" : "done");

  return { flushed, conflicts, failed };
}
```

---

## 6.6 — `apps/booth-app/components/offline-banner.tsx`

Persistent banner shown when booth is offline. Shows pool status.

```typescript
import { View, Text } from "react-native";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { useHoldPoolStore } from "@/stores/hold-pool";
import { useOfflineQueue } from "@/stores/offline-queue";
import { useSessionStore } from "@/stores/session";
import { WifiOff, AlertTriangle } from "lucide-react-native";
import { t } from "@/lib/i18n";

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  const { selectedTerminal } = useSessionStore();
  const { pools } = useHoldPoolStore();
  const { queue, conflictCount } = useOfflineQueue();

  // Conflict banner — shown even when online after a sync with conflicts
  if (isOnline && conflictCount > 0) {
    return (
      <View className="bg-amber-500 px-4 py-2 flex-row items-center gap-2">
        <AlertTriangle size={16} color="white" />
        <Text className="text-white text-sm font-medium flex-1">
          {t("offline.conflictBanner", { count: conflictCount })}
        </Text>
      </View>
    );
  }

  if (isOnline) return null;

  // Count available pool seats across all trips
  const now = new Date();
  const totalAvailable = Object.values(pools).reduce((sum, pool) => {
    const available = pool.holds.filter(
      (h) => !h.consumed && new Date(h.expiresAt) > now,
    ).length;
    return sum + available;
  }, 0);

  const hasExpiredPool = Object.values(pools).some((pool) =>
    pool.holds.every((h) => h.consumed || new Date(h.expiresAt) <= now),
  );

  return (
    <View className="bg-amber-500 px-4 py-2 flex-row items-center gap-2">
      <WifiOff size={16} color="white" />
      <Text className="text-white text-sm font-medium flex-1">
        {hasExpiredPool && totalAvailable === 0
          ? t("sell.offlineExpired")
          : t("sell.offlineBanner", { count: totalAvailable })}
      </Text>
      {queue.length > 0 && (
        <View className="bg-white/20 rounded-full px-2 py-0.5">
          <Text className="text-white text-xs">{queue.length} en attente</Text>
        </View>
      )}
    </View>
  );
}
```

---

## 6.7 — Wire Reconnect Handler in Root Layout

**File**: `apps/booth-app/app/_layout.tsx` — add reconnect effect

```typescript
// Add to RootLayout — import these at the top:
import { useNetworkStatus } from "@/hooks/use-network-status";
import { useOfflineQueue } from "@/stores/offline-queue";
import { flushOfflineQueue } from "@/lib/offline-sync";

// Inside RootLayout, after providers:
function ReconnectHandler() {
  const { isOnline } = useNetworkStatus();
  const { queue } = useOfflineQueue();
  const createCashSale = trpc.booth.createCashSale.useMutation();
  const releaseHolds = trpc.booth.releaseHolds.useMutation();
  const reportUrbanConflict = trpc.booth.reportUrbanConflict.useMutation();
  const prevOnlineRef = useRef(true);

  useEffect(() => {
    const wasOffline = !prevOnlineRef.current;
    prevOnlineRef.current = isOnline;

    // Only flush when transitioning from offline → online and there's a queue
    if (isOnline && wasOffline && queue.length > 0) {
      flushOfflineQueue(
        createCashSale.mutateAsync,
        releaseHolds.mutateAsync,
        reportUrbanConflict.mutateAsync,
      ).then(({ flushed, conflicts, failed }) => {
        if (flushed > 0) {
          Toast.show({
            type: "success",
            text1: `${flushed} vente(s) synchronisée(s)`,
          });
        }
        if (failed > 0) {
          Toast.show({
            type: "error",
            text1: `${failed} vente(s) non synchronisée(s)`,
            text2: "Vérifiez votre connexion et réessayez",
          });
        }
      });
    }
  }, [isOnline]);

  return null;
}
```

Add `<ReconnectHandler />` inside `TRPCReactProvider` in the layout.

---

## 6.8 — Wire Offline Mode into Sell Flow

**`apps/booth-app/app/sell/[tripId].tsx`** — offline mode changes:

When `!isOnline`:
1. Seat map only shows pool-held seats as selectable (already handled in Phase 5 via `offlineAvailableSeatIds`)
2. "Next Available" picks from pool, not full seat map
3. Show pool status: "X sièges disponibles hors ligne"

**`apps/booth-app/app/sell/payment.tsx`** — offline mode changes:

When `!isOnline`:
1. Hide Paystack QR button entirely (requires internet)
2. Only show Cash option
3. Cash sale uses `holdId` from pool instead of creating a new hold
4. Entry goes to offline queue instead of calling server

```typescript
// Offline cash sale (inside payment.tsx handleCashConfirm):
if (!isOnline) {
  // Take a hold from pool
  const poolHold = takeHoldForSale(params.tripId!);
  if (!poolHold) {
    Alert.alert("Réserve épuisée", "Reconnectez-vous pour continuer les ventes intercity.");
    return;
  }

  // Queue the sale for sync
  enqueue({
    tripId: params.tripId!,
    holdId: poolHold.holdId,
    seatId: poolHold.seatId,
    seatNumber: poolHold.seatNumber,
    terminalId: params.terminalId ?? "",
    destinationTerminalId: params.destTerminalId ?? "",
    passengerId: params.passengerId!,
    passengerName: params.passengerName!,
    passengerEmail: params.passengerEmail!,
    passengerPhone: params.passengerPhone || null,
    cashAmountXOF: fareAmountXOF,
    walkedUpPassenger: true,
    passengerAccountCreated: params.isNewAccount === "true",
    isIntercity: params.isIntercity === "true",
    passengerCount: parseInt(params.passengerCount ?? "1"),
  });

  // Show confirmation with "pending sync" note
  router.replace({
    pathname: "/sell/confirmation",
    params: {
      bookingId: "OFFLINE_PENDING",
      passengerEmail: params.passengerEmail,
      isOffline: "true",
    },
  });
  return;
}
```

---

## 6.9 — Verification Checklist

```bash
# TypeScript clean
pnpm --filter booth-app typecheck

# Manual offline tests:
# 1. Enable Airplane mode → OfflineBanner appears with pool count ✓
# 2. Try to select Paystack → button hidden ✓
# 3. Select Cash offline → queued entry added to offline-queue ✓
# 4. Re-enable network → flush triggers → Toast shows X synced ✓
# 5. Force a conflict (book same seat online) → conflict Toast shown ✓
# 6. Pool expires (hold TTL = 90min) → "Pool expired" message shown ✓
```
