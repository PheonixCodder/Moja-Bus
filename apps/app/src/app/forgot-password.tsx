import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

import { AuthButton } from "@/components/auth-button";
import { AuthField } from "@/components/auth-field";
import { AuthShell } from "@/components/auth-shell";
import { Colors, Spacing } from "@/constants/theme";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleRequest() {
    setMessage(null);
    setIsPending(true);

    try {
      const { error } = await authClient.emailOtp.requestPasswordReset({
        email,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      router.replace(`/reset-password?email=${encodeURIComponent(email)}`);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AuthShell
      badge="Password reset"
      title="Request a reset code"
      description="We will send a one-time code to your inbox so you can create a fresh password."
      footer={
        <View style={{ gap: Spacing.three }}>
          <Text style={{ color: Colors.dark.textSecondary, textAlign: "center" }}>
            Remembered your password?
          </Text>
          <AuthButton
            label="Back to sign in"
            variant="secondary"
            onPress={() => router.push("/login")}
          />
        </View>
      }
    >
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

        {message ? (
          <View
            style={{
              borderRadius: 18,
              borderWidth: 1,
              borderColor: "rgba(238, 35, 124, 0.3)",
              backgroundColor: "rgba(238, 35, 124, 0.1)",
              padding: Spacing.four,
            }}
          >
            <Text style={{ color: Colors.dark.primaryForeground, lineHeight: 20 }}>{message}</Text>
          </View>
        ) : null}

        <AuthButton
          label="Send reset code"
          pendingLabel="Sending code..."
          isPending={isPending}
          onPress={handleRequest}
        />
      </View>
    </AuthShell>
  );
}
