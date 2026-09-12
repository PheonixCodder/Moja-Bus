import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { OtpInput } from "react-native-otp-entry";
import { AuthButton } from "@/features/auth/components/auth-button";
import { AuthField } from "@/features/auth/components/auth-field";
import { AuthShell } from "@/features/auth/components/auth-shell";
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
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const slideAnim = useRef(new Animated.Value(0)).current;

  // Redirect if already authenticated
  useEffect(() => {
    if (!sessionPending && session?.user) {
      router.replace("/");
    }
  }, [sessionPending, session?.user]);

  if (sessionPending || session?.user) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Palette.rose[500]} />
      </View>
    );
  }

  function animateForward() {
    slideAnim.setValue(50);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }

  function animateBack() {
    slideAnim.setValue(-50);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }

  async function handleSendCode() {
    if (!identifier.trim()) {
      setMessage(t("auth.login.emailPlaceholder"));
      void BoothFeedback.tap();
      return;
    }

    setMessage(null);
    const detected = detectMethod(identifier);
    setMethod(detected);

    let finalIdentifier = identifier.trim();
    if (detected === "phone") {
      finalIdentifier = normalizePhoneNumber(finalIdentifier);
    } else {
      finalIdentifier = finalIdentifier.toLowerCase();
    }

    setIsPending(true);
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

      void BoothFeedback.tap();
      setStep("otp");
      animateForward();
    } catch (err) {
      void BoothFeedback.tap();
      const parsed = getAuthError(err);
      setMessage(parsed.message || t("auth.login.failedToSend"));
    } finally {
      setIsPending(false);
    }
  }

  async function handleVerifyCode(codeToVerify?: string) {
    const code = codeToVerify ?? otp;
    if (!code || code.length < 6) {
      setMessage(t("auth.login.enterCode"));
      void BoothFeedback.tap();
      return;
    }

    setMessage(null);
    let finalIdentifier = identifier.trim();
    if (method === "phone") {
      finalIdentifier = normalizePhoneNumber(finalIdentifier);
    } else {
      finalIdentifier = finalIdentifier.toLowerCase();
    }

    setIsPending(true);
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
      void BoothFeedback.tap();
      const { message: errMsg, code: errCode, status } = getAuthError(err);
      let localizedMsg = t("auth.login.errorInvalid");

      if (status === 403) {
        localizedMsg = t("auth.login.errorNoAccess");
      } else if (errCode === "INVALID_OTP") {
        localizedMsg = t("auth.login.errorInvalid");
      } else if (errCode === "OTP_EXPIRED") {
        localizedMsg = t("auth.login.codeExpired");
      } else if (errCode === "TOO_MANY_ATTEMPTS") {
        localizedMsg = t("auth.login.tooManyAttempts");
      } else if (errMsg) {
        localizedMsg = errMsg;
      }

      setMessage(localizedMsg);
    } finally {
      setIsPending(false);
    }
  }

  const stepConfig = {
    input: {
      badge: t("auth.login.sendCode"),
      title: t("auth.login.title"),
      description: t("auth.login.subtitle"),
    },
    otp: {
      badge: t("auth.login.verify"),
      title: t("auth.login.enterCode"),
      description: t("auth.login.enter6DigitCode", { identifier }),
    },
  } as const;

  const { badge, title, description } = stepConfig[step];

  return (
    <AuthShell
      badge={badge}
      title={title}
      description={description}
      logoSource={require("@/assets/logo/moja-logo.png")}
    >
      <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
        {step === "input" ? (
          <View className="gap-5">
            <AuthField
              label={t("auth.login.emailOrPhone")}
              placeholder={t("auth.login.emailPlaceholder")}
              autoCapitalize="none"
              keyboardType="email-address"
              value={identifier}
              onChangeText={(val) => {
                setIdentifier(val);
                if (message) setMessage(null);
              }}
              onSubmitEditing={handleSendCode}
              editable={!isPending}
            />

            {message ? (
              <Text className="text-[13px] leading-[18px] text-primary">
                {message}
              </Text>
            ) : null}

            <AuthButton
              label={t("auth.login.sendCode")}
              pendingLabel={t("auth.login.sendingCode")}
              isPending={isPending}
              onPress={handleSendCode}
            />
          </View>
        ) : null}

        {step === "otp" ? (
          <View className="gap-4">
            <View className="gap-2">
              <Text className="text-[14px] font-semibold text-foreground">
                {t("auth.login.verifying")}
              </Text>
              <OtpInput
                numberOfDigits={6}
                type="numeric"
                autoFocus
                onTextChange={(val) => {
                  setOtp(val);
                  if (message) setMessage(null);
                }}
                onFilled={(filledOtp) => {
                  setOtp(filledOtp);
                  void handleVerifyCode(filledOtp);
                }}
                theme={{
                  containerStyle: {
                    width: "100%",
                    gap: 4,
                  },
                  pinCodeContainerStyle: {
                    flex: 1,
                    minHeight: 52,
                    aspectRatio: 1,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: "rgba(238, 35, 124, 0.3)",
                    backgroundColor: "rgba(238, 35, 124, 0.05)",
                  },
                  focusedPinCodeContainerStyle: {
                    borderColor: Palette.rose[500],
                  },
                  pinCodeTextStyle: {
                    color: Colors.light.textPrimary,
                    fontSize: 24,
                    fontWeight: "700",
                  },
                  focusStickStyle: {
                    backgroundColor: Palette.rose[500],
                  },
                }}
              />
            </View>

            {message ? (
              <Text className="text-[13px] leading-[18px] text-primary">
                {message}
              </Text>
            ) : null}

            <AuthButton
              label={t("auth.login.verify")}
              pendingLabel={t("auth.login.verifying")}
              isPending={isPending}
              onPress={() => handleVerifyCode()}
            />

            <AuthButton
              label={t("auth.login.useDifferentMethod")}
              variant="secondary"
              onPress={() => {
                setStep("input");
                setOtp("");
                setMessage(null);
                animateBack();
              }}
            />
          </View>
        ) : null}
      </Animated.View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.background,
  },
});
