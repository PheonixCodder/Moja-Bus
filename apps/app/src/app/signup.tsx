import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

import { AuthButton } from "@/components/auth-button";
import { AuthField } from "@/components/auth-field";
import { AuthShell } from "@/components/auth-shell";
import { Colors, Spacing } from "@/constants/theme";
import { authClient } from "@/lib/auth-client";

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSignup() {
    setMessage(null);
    setIsPending(true);

    try {
      const { error } = await authClient.signUp.email({
        name,
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      router.replace(`/verify-email?email=${encodeURIComponent(email)}`);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AuthShell
      badge="Traveler signup"
      title="Create your traveler account"
      description="Set up your passenger profile once, verify your email, and reuse the same account on web and mobile."
      footer={
        <View style={{ gap: Spacing.three }}>
          <Text style={{ color: Colors.dark.textSecondary, textAlign: "center" }}>
            Already have an account?
          </Text>
          <AuthButton
            label="Sign in"
            variant="secondary"
            onPress={() => router.push("/login")}
          />
        </View>
      }
    >
      <View style={{ gap: Spacing.four }}>
        <AuthField
          label="Full name"
          placeholder="Awa Kone"
          autoCapitalize="words"
          textContentType="name"
          value={name}
          onChangeText={setName}
        />
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
          placeholder="At least 8 characters"
          secureTextEntry
          textContentType="newPassword"
          helperText="Email verification will be required before the account can be used."
          value={password}
          onChangeText={setPassword}
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
          label="Create account"
          pendingLabel="Creating account..."
          isPending={isPending}
          onPress={handleSignup}
        />
      </View>
    </AuthShell>
  );
}
