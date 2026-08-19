import * as SecureStore from "expo-secure-store";

const KEY = "moja:pending-referral:v1";

/**
 * Persist a referral code so it survives app relaunches.
 * Called when the user opens a /r/[code] deep link.
 */
export async function storePendingReferralCode(code: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, code.trim().toUpperCase());
  } catch {
    // ignore — SecureStore unavailable on some simulators
  }
}

/**
 * Read the stored code without clearing it (idempotent).
 */
export async function peekPendingReferralCode(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}

/**
 * Delete the stored code after a successful apply (or definitive rejection).
 */
export async function consumePendingReferralCode(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // ignore
  }
}
