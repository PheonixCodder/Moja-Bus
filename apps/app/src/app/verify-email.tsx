import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";

import { AuthButton } from "@/components/auth-button";
import { AuthField } from "@/components/auth-field";
import { AuthShell } from "@/components/auth-shell";
import { Colors, Spacing } from "@/constants/theme";
import { authClient } from "@/lib/auth-client";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const inferredEmail = useMemo(() => params.email ?? "", [params.email]);
  const [email, setEmail] = useState(inferredEmail);
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleVerify() {
    setMessage(null);
    setIsPending(true);

    try {
      const { error } = await authClient.emailOtp.verifyEmail({
        email,
        otp,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      router.replace("/dashboard");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AuthShell
      badge="Verify email"
      title="Enter the one-time code"
      description="We sent a verification code to your email address. Use it here to activate the account."
      footer={
        <View style={{ gap: Spacing.three }}>
          <Text
            style={{ color: Colors.dark.textSecondary, textAlign: "center" }}
          >
            Need a different account?
          </Text>
          <AuthButton
            label="Return to sign in"
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
        <AuthField
          label="Verification code"
          placeholder="123456"
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          value={otp}
          onChangeText={setOtp}
          helperText="Check the inbox for the OTP sent from the Express auth server."
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
            <Text
              style={{ color: Colors.dark.primaryForeground, lineHeight: 20 }}
            >
              {message}
            </Text>
          </View>
        ) : null}

        <AuthButton
          label="Verify email"
          pendingLabel="Verifying..."
          isPending={isPending}
          onPress={handleVerify}
        />
      </View>
    </AuthShell>
  );
}
