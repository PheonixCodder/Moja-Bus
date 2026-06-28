import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import {
  GoogleSignin,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";

import { AuthButton } from "@/components/auth-button";
import { AuthField } from "@/components/auth-field";
import { AuthShell } from "@/components/auth-shell";
import { Colors, Spacing } from "@/constants/theme";
import { authClient } from "@/lib/auth-client";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isEmailPending, setIsEmailPending] = useState(false);
  const [isGooglePending, setIsGooglePending] = useState(false);

  async function handleGoogleLogin() {
    setMessage(null);
    setIsGooglePending(true);

    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response) || !response.data.idToken) {
        setMessage("Google did not return an ID token.");
        return;
      }

      const { error } = await authClient.signIn.social({
        provider: "google",
        idToken: {
          token: response.data.idToken,
          accessToken: response.data.accessToken,
        },
        callbackURL: "/dashboard",
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      router.replace("/dashboard");
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code?: string }).code === "SIGN_IN_CANCELLED"
      ) {
        return;
      }

      setMessage(error instanceof Error ? error.message : "Google sign in failed.");
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
        callbackURL: "/dashboard",
      });

      if (error) {
        const lowerMessage = error.message.toLowerCase();
        if (lowerMessage.includes("verify") || lowerMessage.includes("verification")) {
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
      description="Use Google on mobile for the fastest sign in, or log in with your email and password."
      footer={
        <View style={{ gap: Spacing.three }}>
          <Text style={{ color: Colors.dark.textSecondary, textAlign: "center" }}>
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
          <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.1)" }} />
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
          <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.1)" }} />
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
              onPress={() => router.push(`/verify-email?email=${encodeURIComponent(email)}`)}
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
