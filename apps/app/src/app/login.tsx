import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";

import { AuthButton } from "@/components/auth-button";
import { AuthField } from "@/components/auth-field";
import { AuthShell } from "@/components/auth-shell";
import { Colors, Spacing } from "@/constants/theme";
import { authClient } from "@/lib/auth-client";

// Clear any pending auth sessions on app start
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isEmailPending, setIsEmailPending] = useState(false);
  const [isGooglePending, setIsGooglePending] = useState(false);
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();

  // Redirect to dashboard if already logged in
  if (!isSessionPending && session?.user) {
    router.replace("/dashboard");
    return null;
  }

  // Show loading while checking session
  if (isSessionPending) {
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

  async function handleGoogleLogin() {
    setMessage(null);
    setIsGooglePending(true);

    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
      });

      if (error?.message) {
        setMessage(error.message);
        return;
      }

      // On success, the expoClient handles the redirect automatically
      // If we're still here, manually navigate
      router.replace("/dashboard");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Google sign in failed.",
      );
    } finally {
      setIsGooglePending(false);
    }
  }

  async function handleEmailLogin() {
    setMessage(null);
    setIsEmailPending(true);

    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error?.message) {
        const lowerMessage = error.message.toLowerCase();
        if (
          lowerMessage.includes("verify") ||
          lowerMessage.includes("verification")
        ) {
          router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        }

        setMessage(error.message);
        return;
      }

      router.replace("/dashboard");
    } finally {
      setIsEmailPending(false);
    }
  }

  return (
    <AuthShell
      badge="Traveler auth"
      title="Sign in to continue"
      description="Use Google for the fastest sign in, or log in with your email and password."
      footer={
        <View style={{ gap: Spacing.three }}>
          <Text
            style={{ color: Colors.dark.textSecondary, textAlign: "center" }}
          >
            New traveler?
          </Text>
          <AuthButton
            label="Create account"
            variant="secondary"
            onPress={() => router.push("/signup")}
          />
        </View>
      }
    >
      <View style={{ gap: Spacing.four }}>
        <AuthButton
          label="Continue with Google"
          pendingLabel="Opening Google..."
          isPending={isGooglePending}
          onPress={handleGoogleLogin}
        />

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.three,
          }}
        >
          <View
            style={{
              flex: 1,
              height: 1,
              backgroundColor: "rgba(255,255,255,0.1)",
            }}
          />
          <Text
            style={{
              color: Colors.dark.textSecondary,
              fontSize: 12,
              letterSpacing: 2.4,
              textTransform: "uppercase",
            }}
          >
            Or email
          </Text>
          <View
            style={{
              flex: 1,
              height: 1,
              backgroundColor: "rgba(255,255,255,0.1)",
            }}
          />
        </View>

        <View style={{ gap: Spacing.four }}>
          <AuthField
            label="Email"
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
          />
          <AuthField
            label="Password"
            placeholder="Enter password"
            secureTextEntry
            textContentType="password"
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {message ? (
          <View
            style={{
              borderRadius: 18,
              borderWidth: 1,
              borderColor: "rgba(251, 191, 36, 0.18)",
              backgroundColor: "rgba(251, 191, 36, 0.08)",
              padding: Spacing.four,
            }}
          >
            <Text style={{ color: "#fde68a", lineHeight: 20 }}>{message}</Text>
            <Text
              onPress={() =>
                router.push(`/verify-email?email=${encodeURIComponent(email)}`)
              }
              style={{
                marginTop: Spacing.two,
                color: Colors.dark.text,
                textDecorationLine: "underline",
              }}
            >
              Verify email
            </Text>
          </View>
        ) : null}

        <AuthButton
          label="Sign in"
          pendingLabel="Signing in..."
          isPending={isEmailPending}
          onPress={handleEmailLogin}
        />

        <Text
          onPress={() => router.push("/forgot-password")}
          style={{
            color: Colors.dark.textSecondary,
            textAlign: "center",
            fontSize: 13,
          }}
        >
          Forgot password?
        </Text>
      </View>
    </AuthShell>
  );
}
