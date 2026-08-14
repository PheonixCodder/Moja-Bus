import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Offer } from "@/features/search/components/offer-card";
import type { CityValue, SearchFilters, SortKey } from "@/features/search/types";

export interface PendingSearchSnapshot {
  origin: CityValue;
  destination: CityValue;
  date: string; // YYYY-MM-DD
  passengers: number;
  sort: SortKey;
  filters: SearchFilters;
}

export interface PendingCheckout {
  offer: Offer;
  seatIds: string[];
  passengers: number;
  /** Full search UI state so login return restores results + form */
  search?: PendingSearchSnapshot;
}

interface PendingCheckoutStore {
  pending: PendingCheckout | null;
  _hasHydrated: boolean;
  setPending: (checkout: PendingCheckout) => void;
  clearPending: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const usePendingCheckoutStore = create<PendingCheckoutStore>()(
  persist(
    (set) => ({
      pending: null,
      _hasHydrated: false,
      setPending: (checkout) => set({ pending: checkout }),
      clearPending: () => set({ pending: null }),
      setHasHydrated: (value) => set({ _hasHydrated: value }),
    }),
    {
      name: "@moja/pending-checkout",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ pending: state.pending }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

/** Build expo-router search params for returnTo after login. */
export function buildSearchReturnParams(snapshot: PendingSearchSnapshot): Record<string, string> {
  const params: Record<string, string> = {
    from: snapshot.origin.id,
    fromText: snapshot.origin.text,
    to: snapshot.destination.id,
    toText: snapshot.destination.text,
    date: snapshot.date,
    passengers: String(snapshot.passengers),
  };
  if (snapshot.origin.municipalityId) params['fromMuni'] = snapshot.origin.municipalityId;
  if (snapshot.origin.quarterId) params['fromQuarter'] = snapshot.origin.quarterId;
  if (snapshot.destination.municipalityId) params['toMuni'] = snapshot.destination.municipalityId;
  if (snapshot.destination.quarterId) params['toQuarter'] = snapshot.destination.quarterId;
  return params;
}

export function buildSearchReturnTo(snapshot: PendingSearchSnapshot): string {
  const qs = new URLSearchParams(buildSearchReturnParams(snapshot)).toString();
  return `/(tabs)/search?${qs}`;
}
