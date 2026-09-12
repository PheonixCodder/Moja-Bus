/**
 * Session Store — Phase B3
 *
 * Persists the currently selected terminal for the shift, plus operator profile
 * context (company, staff ID, name, role) loaded via booth.getMyProfile.
 * Terminal selection and profile survive app restart (AsyncStorage-backed).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { SupportedLocale } from "@/lib/i18n";

export type SelectedTerminal = {
  id: string;
  name: string;
};

export type OperatorProfile = {
  operatorId: string;
  role: string;
  companyId: string;
  companyName?: string;
  companyLogoUrl?: string | null;
  staffName: string;
  staffEmail: string;
  assignedTerminal?: { id: string; name: string } | null;
};

type SessionState = {
  terminal: SelectedTerminal | null;
  profile: OperatorProfile | null;
  profileLoaded: boolean;
  locale: SupportedLocale;
  setTerminal: (t: SelectedTerminal | null) => void;
  setProfile: (p: OperatorProfile | null) => void;
  setProfileLoaded: (loaded: boolean) => void;
  setLocale: (locale: SupportedLocale) => void;
  clearSession: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      terminal: null,
      profile: null,
      profileLoaded: false,
      locale: "fr",
      setTerminal: (terminal) => set({ terminal }),
      setProfile: (profile) => set({ profile }),
      setProfileLoaded: (loaded) => set({ profileLoaded: loaded }),
      setLocale: (locale) => set({ locale }),
      clearSession: () =>
        set({ terminal: null, profile: null, profileLoaded: false }),
    }),
    {
      name: "booth-session",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        terminal: state.terminal,
        profile: state.profile,
        locale: state.locale,
      }),
    },
  ),
);

/**
 * Granular selectors to avoid re-rendering entire screen trees
 * when unrelated session properties change.
 */
export const selectTerminalId = (state: SessionState): string =>
  state.terminal?.id ?? "";

export const selectTerminalName = (state: SessionState): string =>
  state.terminal?.name ?? "";

export const selectIsTerminalLocked = (state: SessionState): boolean =>
  Boolean(state.profile?.assignedTerminal?.id);

export const selectCashierName = (state: SessionState): string =>
  state.profile?.staffName ?? "";

export const selectCompanyName = (state: SessionState): string =>
  state.profile?.companyName ?? "Moja Ride";
