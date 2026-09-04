import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type UserRoleMode = "DRIVER" | "CONDUCTOR" | null;

interface UserModeState {
  roleMode: UserRoleMode;
  setRoleMode: (mode: UserRoleMode) => void;
  reset: () => void;
}

export const useUserModeStore = create<UserModeState>()(
  persist(
    (set) => ({
      roleMode: null,
      setRoleMode: (roleMode) => set({ roleMode }),
      reset: () => set({ roleMode: null }),
    }),
    {
      name: "moja-user-mode",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
