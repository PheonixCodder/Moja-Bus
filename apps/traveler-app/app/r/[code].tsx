import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { authClient } from "@/lib/auth-client";
import { storePendingReferralCode } from "@/lib/pending-referral";

/**
 * Referral deep-link landing screen.
 *
 * Handles:
 *   traveler-app://r/ABC123        (custom URL scheme)
 *   https://mojaride.com/r/ABC123  (Universal Link / App Link)
 *
 * Flow:
 *  1. Store the code in SecureStore so it survives login/relaunch.
 *  2. Redirect:
 *     - Logged-in  → home (usePendingReferralApplier in _layout fires)
 *     - Logged-out → register screen so user creates an account
 */
export default function ReferralLandingScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return; // wait for session to resolve
    if (!code?.trim()) {
      router.replace("/");
      return;
    }

    void (async () => {
      await storePendingReferralCode(code.trim());
      if (session?.user) {
        // Already logged in — go home; the applier hook will fire automatically
        router.replace("/(tabs)");
      } else {
        // Guest — send to login so they authenticate with referral pending
        router.replace("/login");
      }
    })();
  }, [isPending, code, session?.user]);

  // Show a brief loading spinner while session resolves / redirect executes
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
      <ActivityIndicator size="large" color="#ee237c" />
    </View>
  );
}
