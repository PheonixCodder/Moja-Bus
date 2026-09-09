import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authClient } from "@/lib/auth-client";
import { BoothFeedback } from "@/lib/haptics";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Toast.show({ type: "error", text1: t("errors.generic") });
      return;
    }

    setLoading(true);
    try {
      const result = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password,
      });

      if (result.error) {
        BoothFeedback.tap();
        const messageKey =
          result.error.status === 403
            ? "auth.login.errorNoAccess"
            : "auth.login.errorInvalid";
        Toast.show({ type: "error", text1: t(messageKey) });
        return;
      }

      BoothFeedback.successScan();
      router.replace("/");
    } catch {
      BoothFeedback.tap();
      Toast.show({ type: "error", text1: t("errors.network") });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <ScrollView
        contentContainerClassName="flex-1 justify-center px-6 py-12"
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-10">
          <Text className="text-3xl font-bold text-primary">Moja Ride</Text>
          <Text className="text-foreground/60 mt-1 text-base">
            {t("auth.login.subtitle")}
          </Text>
        </View>

        <View className="gap-4">
          <Input
            label={t("auth.login.emailLabel")}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="next"
            editable={!loading}
          />

          <Input
            label={t("auth.login.passwordLabel")}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            editable={!loading}
          />

          <Button
            title={t("auth.login.submitButton")}
            onPress={handleLogin}
            loading={loading}
            size="lg"
            className="mt-2"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
