import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";

import { AuthButton } from "@/components/auth-button";
import { AuthField } from "@/components/auth-field";
import { AuthShell } from "@/components/auth-shell";
import { Colors, Spacing } from "@/constants/theme";
import { authClient } from "@/lib/auth-client";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const inferredEmail = useMemo(() => params.email ?? "", [params.email]);
  const [email, setEmail] = useState(inferredEmail);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleReset() {
    setMessage(null);

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setIsPending(true);

    try {
      const { error } = await authClient.emailOtp.resetPassword({
        email,
        otp,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      router.replace("/login");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AuthShell
      badge="New password"
      title="Create a fresh password"
      description="Enter the reset code and choose a new password for the traveler account."
      footer={
        <View style={{ gap: Spacing.three }}>
          <Text
            style={{ color: Colors.dark.textSecondary, textAlign: "center" }}
          >
            Need another code?
          </Text>
          <AuthButton
            label="Request reset again"
            variant="secondary"
            onPress={() => router.push("/forgot-password")}
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
          label="Reset code"
          placeholder="123456"
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          value={otp}
          onChangeText={setOtp}
        />
        <AuthField
          label="New password"
          placeholder="At least 8 characters"
          secureTextEntry
          textContentType="newPassword"
          value={password}
          onChangeText={setPassword}
        />
        <AuthField
          label="Confirm password"
          placeholder="Repeat the password"
          secureTextEntry
          textContentType="newPassword"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
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
          label="Reset password"
          pendingLabel="Resetting..."
          isPending={isPending}
          onPress={handleReset}
        />
      </View>
    </AuthShell>
  );
}
