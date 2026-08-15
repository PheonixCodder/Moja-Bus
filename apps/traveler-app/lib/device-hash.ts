import * as SecureStore from "expo-secure-store";

const STORAGE_KEY = "moja:device-id:v1";

function randomId(): string {
  return `d_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Stable anonymized device id for referral abuse checks.
 */
export async function getDeviceHash(): Promise<string | undefined> {
  try {
    let id = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!id) {
      id = randomId();
      await SecureStore.setItemAsync(STORAGE_KEY, id);
    }
    return id.slice(0, 128);
  } catch {
    return undefined;
  }
}
