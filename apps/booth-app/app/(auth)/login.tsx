import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { OtpInput } from "react-native-otp-entry";
import Toast from "react-native-toast-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Colors, Palette } from "@/constants/theme";
import { authClient, refreshSession } from "@/lib/auth-client";
import { BoothFeedback } from "@/lib/haptics";

type AuthStep = "input" | "otp";

type AuthError = { message?: string; code?: string; status?: number };

function getAuthError(err: unknown): {
  message: string;
  code: string | undefined;
  status: number | undefined;
} {
  if (err instanceof Error) {
    return { message: err.message, code: undefined, status: undefined };
  }
  if (typeof err === "object" && err !== null) {
    const authErr = err as AuthError;
    return {
      message: authErr.message ?? "An unexpected error occurred",
      code: authErr.code,
      status: authErr.status,
    };
  }
  return {
    message: "An unexpected error occurred",
    code: undefined,
    status: undefined,
  };
}

function detectMethod(input: string): "phone" | "email" {
  const clean = input.trim();
  if (
    clean.startsWith("+225") ||
    clean.startsWith("07") ||
    clean.startsWith("05") ||
    clean.startsWith("01") ||
    /^[0-9\s+\-()]+$/.test(clean)
  ) {
    return "phone";
  }
  return "email";
}

function normalizePhoneNumber(raw: string): string {
  let cleaned = raw.replace(/[\s\-()]/g, "");
  if (!cleaned.startsWith("+")) {
    if (cleaned.length === 10) {
      cleaned = `+225${cleaned}`;
    }
  }
  return cleaned;
}

export default function LoginScreen() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const { t } = useTranslation();

  const [step, setStep] = useState<AuthStep>("input");
  const [identifier, setIdentifier] = useState("");
  const [method, setMethod] = useState<"phone" | "email">("email");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const slideAnim = useRef(new Animated.Value(0)).current;

  // Redirect if session already exists
  useEffect(() => {
    if (!sessionPending && session?.user) {
      router.replace("/");
    }
  }, [sessionPending, session?.user]);

  function animateForward() {
    slideAnim.setValue(40);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }

  function animateBack() {
    slideAnim.setValue(-40);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }

  async function handleSendCode() {
    if (!identifier.trim()) {
      setErrorMessage(t("errors.generic"));
      BoothFeedback.tap();
      return;
    }

    setErrorMessage(null);
    const detected = detectMethod(identifier);
    setMethod(detected);

    let finalIdentifier = identifier.trim();
    if (detected === "phone") {
      finalIdentifier = normalizePhoneNumber(finalIdentifier);
    } else {
      finalIdentifier = finalIdentifier.toLowerCase();
    }

    setLoading(true);
    try {
      if (detected === "phone") {
        const { error } = await authClient.phoneNumber.sendOtp({
          phoneNumber: finalIdentifier,
        });
        if (error) throw error;
      } else {
        const { error } = await authClient.emailOtp.sendVerificationOtp({
          email: finalIdentifier,
          type: "sign-in",
        });
        if (error) throw error;
      }

      BoothFeedback.tap();
      setStep("otp");
      animateForward();
    } catch (err) {
      BoothFeedback.tap();
      const parsed = getAuthError(err);
      setErrorMessage(parsed.message || t("auth.login.failedToSend"));
      Toast.show({
        type: "error",
        text1: parsed.message || t("auth.login.failedToSend"),
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(codeToVerify?: string) {
    const code = codeToVerify ?? otp;
    if (!code || code.length < 6) {
      setErrorMessage(t("auth.login.enterCode"));
      BoothFeedback.tap();
      return;
    }

    setErrorMessage(null);
    let finalIdentifier = identifier.trim();
    if (method === "phone") {
      finalIdentifier = normalizePhoneNumber(finalIdentifier);
    } else {
      finalIdentifier = finalIdentifier.toLowerCase();
    }

    setLoading(true);
    try {
      if (method === "phone") {
        const result = await authClient.phoneNumber.verify({
          phoneNumber: finalIdentifier,
          code,
        });
        if (result.error) throw result.error;
      } else {
        const result = await authClient.signIn.emailOtp({
          email: finalIdentifier,
          otp: code,
        });
        if (result.error) throw result.error;
      }

      try {
        await refreshSession();
      } catch {}

      await BoothFeedback.successScan();
      router.replace("/");
    } catch (err) {
      await BoothFeedback.tap();
      const { message, code: errCode, status } = getAuthError(err);
      let localizedMsg = t("auth.login.errorInvalid");

      if (status === 403) {
        localizedMsg = t("auth.login.errorNoAccess");
      } else if (errCode === "INVALID_OTP") {
        localizedMsg = t("auth.login.errorInvalid");
      } else if (errCode === "OTP_EXPIRED") {
        localizedMsg = t("auth.login.codeExpired");
      } else if (errCode === "TOO_MANY_ATTEMPTS") {
        localizedMsg = t("auth.login.tooManyAttempts");
      } else if (message) {
        localizedMsg = message;
      }

      setErrorMessage(localizedMsg);
      Toast.show({ type: "error", text1: localizedMsg });
    } finally {
      setLoading(false);
    }
  }

  if (sessionPending || session?.user) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={Palette.rose[500]} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6 py-12"
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-8">
          <View className="w-16 h-16 rounded-3xl bg-primary/10 items-center justify-center mb-3">
            <Text className="text-3xl font-extrabold text-primary">MR</Text>
          </View>
          <Text className="text-3xl font-bold text-foreground">
            {t("auth.login.title")}
          </Text>
          <Text className="text-foreground/60 mt-1 text-sm text-center">
            {step === "input"
              ? t("auth.login.subtitle")
              : t("auth.login.enter6DigitCode", { identifier })}
          </Text>
        </View>

        <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
          {step === "input" ? (
            <View className="gap-4">
              <View className="gap-2">
                <Label>{t("auth.login.emailOrPhone")}</Label>
                <Input
                  placeholder={t("auth.login.emailPlaceholder")}
                  value={identifier}
                  onChangeText={(val) => {
                    setIdentifier(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="send"
                  onSubmitEditing={handleSendCode}
                  editable={!loading}
                />
              </View>

              {errorMessage ? (
                <Text className="text-xs font-semibold text-destructive px-1">
                  {errorMessage}
                </Text>
              ) : null}

              <Button
                onPress={handleSendCode}
                disabled={loading}
                size="lg"
                className="mt-2 min-h-[48px] h-12"
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text className="text-primary-foreground font-semibold text-base">
                    {t("auth.login.sendCode")}
                  </Text>
                )}
              </Button>
            </View>
          ) : (
            <View className="gap-5">
              <View className="gap-2">
                <Text className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                  {t("auth.login.enterCode")}
                </Text>
                <OtpInput
                  numberOfDigits={6}
                  type="numeric"
                  autoFocus
                  onTextChange={(val) => {
                    setOtp(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  onFilled={(filledOtp) => {
                    setOtp(filledOtp);
                    void handleVerifyCode(filledOtp);
                  }}
                  theme={{
                    containerStyle: {
                      width: "100%",
                      justifyContent: "space-between",
                    },
                    pinCodeContainerStyle: {
                      flex: 1,
                      minHeight: 52,
                      aspectRatio: 1,
                      borderRadius: 16,
                      borderWidth: 1.5,
                      borderColor: "rgba(238, 35, 124, 0.3)",
                      backgroundColor: "rgba(238, 35, 124, 0.05)",
                      marginHorizontal: 2,
                    },
                    focusedPinCodeContainerStyle: {
                      borderColor: Palette.rose[500],
                      backgroundColor: "rgba(238, 35, 124, 0.1)",
                    },
                    pinCodeTextStyle: {
                      color: Colors.light.textPrimary,
                      fontSize: 22,
                      fontWeight: "700",
                    },
                    focusStickStyle: {
                      backgroundColor: Palette.rose[500],
                    },
                  }}
                />
              </View>

              {errorMessage ? (
                <Text className="text-xs font-semibold text-destructive px-1">
                  {errorMessage}
                </Text>
              ) : null}

              <Button
                onPress={() => handleVerifyCode()}
                disabled={loading}
                size="lg"
                className="mt-2 min-h-[48px] h-12"
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text className="text-primary-foreground font-semibold text-base">
                    {t("auth.login.verify")}
                  </Text>
                )}
              </Button>

              <Button
                variant="outline"
                onPress={() => {
                  setStep("input");
                  setOtp("");
                  setErrorMessage(null);
                  animateBack();
                }}
                disabled={loading}
                size="default"
                className="min-h-[48px] h-12"
              >
                <Text className="font-semibold text-base">
                  {t("auth.login.useDifferentMethod")}
                </Text>
              </Button>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
