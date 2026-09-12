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
    },
  ),
);
