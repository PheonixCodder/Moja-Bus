import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { AuthButton } from "@/components/auth-button";
import { Colors, Spacing } from "@/constants/theme";
import { authClient } from "@/lib/auth-client";

export default function DashboardScreen() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { data: session, isPending } = authClient.useSession();

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await authClient.signOut();
      router.replace("/login");
    } finally {
      setIsSigningOut(false);
    }
  }

  if (isPending) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: Colors.dark.background,
        }}
      >
        <ActivityIndicator color={Colors.dark.text} />
      </View>
    );
  }

  if (!session?.user) {
    return <Redirect href="/login" />;
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.dark.background,
        padding: Spacing.four,
        justifyContent: "center",
      }}
    >
      <View
        style={{
          borderRadius: 28,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
          backgroundColor: "rgba(4, 10, 17, 0.92)",
          padding: Spacing.five,
          gap: Spacing.four,
        }}
      >
        <Text style={{ color: Colors.dark.textSecondary, textTransform: "uppercase", letterSpacing: 2.4 }}>
          Traveler dashboard
        </Text>
        <Text style={{ color: Colors.dark.text, fontSize: 30, fontWeight: "700" }}>
          Welcome back, {session.user.name}.
        </Text>
        <Text style={{ color: Colors.dark.textSecondary, lineHeight: 23 }}>
          Your traveler account is now authenticated against the shared Express backend.
        </Text>

        <View style={{ gap: Spacing.two }}>
          <Text style={{ color: Colors.dark.textSecondary }}>Email</Text>
          <Text style={{ color: Colors.dark.text }}>{session.user.email}</Text>
        </View>

        <View style={{ gap: Spacing.two }}>
          <Text style={{ color: Colors.dark.textSecondary }}>Flow</Text>
          <Text style={{ color: Colors.dark.text }}>
            Email, password, Google SDK + ID token, and OTP verification
          </Text>
        </View>

        <AuthButton
          label="Sign out"
          pendingLabel="Signing out..."
          isPending={isSigningOut}
          onPress={handleSignOut}
        />
      </View>
    </View>
  );
}
