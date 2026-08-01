import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
	Animated,
	KeyboardAvoidingView,
	Platform,
	Text,
	View,
} from "react-native";
import { OtpInput } from "react-native-otp-entry";
import { useTranslation } from "react-i18next";

import { AuthButton } from "@/features/auth/components/auth-button";
import { AuthField } from "@/features/auth/components/auth-field";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { authClient } from "@/lib/auth-client";

type AuthError = { message?: string; code?: string };

function getAuthError(err: unknown): {
	message: string;
	code: string | undefined;
} {
	if (err instanceof Error) return { message: err.message, code: undefined };
	if (typeof err === "object" && err !== null) {
		const authErr = err as AuthError;
		return {
			message: authErr.message ?? "An unexpected error occurred",
			code: authErr.code,
		};
	}
	return { message: "An unexpected error occurred", code: undefined };
}

type AuthStep = "input" | "otp" | "profile";

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

export default function LoginView() {
	const router = useRouter();
	const { t } = useTranslation("auth");
	const [step, setStep] = useState<AuthStep>("input");
	const [identifier, setIdentifier] = useState("");
	const [method, setMethod] = useState<"phone" | "email">("email");
	const [otp, setOtp] = useState("");
	const [fullName, setFullName] = useState("");
	const [message, setMessage] = useState<string | null>(null);
	const [isPending, setIsPending] = useState(false);

	const slideAnim = useRef(new Animated.Value(0)).current;

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
		setMessage(null);
		const detected = detectMethod(identifier);
		setMethod(detected);

		let finalIdentifier = identifier.trim();
		if (detected === "phone" && !finalIdentifier.startsWith("+")) {
			if (finalIdentifier.length === 10) {
				finalIdentifier = `+225${finalIdentifier}`;
			}
		}

		setIsPending(true);
		try {
			if (detected === "phone") {
				const { error } = await authClient.phoneNumber.sendOtp({
					phoneNumber: finalIdentifier,
				});
				if (error) throw new Error(error.message);
			} else {
				const { error } = await authClient.emailOtp.sendVerificationOtp({
					email: finalIdentifier,
					type: "sign-in",
				});
				if (error) throw new Error(error.message);
			}
			setStep("otp");
			animateForward();
		} catch (err) {
			setMessage(
				getAuthError(err).message || t("failedToSend"),
			);
		} finally {
			setIsPending(false);
		}
	}

	async function handleVerifyCode(code?: string) {
		const otpValue = code ?? otp;
		setMessage(null);
		let finalIdentifier = identifier.trim();
		if (
			method === "phone" &&
			!finalIdentifier.startsWith("+") &&
			finalIdentifier.length === 10
		) {
			finalIdentifier = `+225${finalIdentifier}`;
		}

		setIsPending(true);
		try {
			type PhoneVerifyResult = Awaited<
				ReturnType<typeof authClient.phoneNumber.verify>
			>;
			type EmailOtpResult = Awaited<
				ReturnType<typeof authClient.signIn.emailOtp>
			>;
			let result: PhoneVerifyResult | EmailOtpResult;
			if (method === "phone") {
				result = await authClient.phoneNumber.verify({
					phoneNumber: finalIdentifier,
					code: otpValue,
				});
			} else {
				result = await authClient.signIn.emailOtp({
					email: finalIdentifier,
					otp: otpValue,
				});
			}

			if (result.error) throw result.error;

			const isNewUser =
				new Date(result.data.user.createdAt).getTime() > Date.now() - 10000;

			if (isNewUser) {
				setStep("profile");
				animateForward();
			} else {
				router.replace("/(tabs)");
			}
		} catch (err) {
			const { message, code } = getAuthError(err);
			let msg = t("invalidCode");
			if (code === "INVALID_OTP") {
				msg = t("invalidCode");
			} else if (code === "OTP_EXPIRED") {
				msg = t("codeExpired");
			} else if (code === "TOO_MANY_ATTEMPTS") {
				msg = t("tooManyAttempts");
			} else if (message) {
				msg = message;
			}
			setMessage(msg);
		} finally {
			setIsPending(false);
		}
	}

	async function handleCompleteProfile() {
		if (!fullName.trim() || fullName.trim().length < 2) {
			setMessage("Please enter your full name.");
			return;
		}

		setMessage(null);
		setIsPending(true);
		try {
			const { error } = await authClient.updateUser({
				name: fullName.trim(),
			});
			if (error) throw error;

			router.replace("/(tabs)");
		} catch (err) {
			setMessage(getAuthError(err).message || t("failedToUpdate"));
		} finally {
			setIsPending(false);
		}
	}

	const stepConfig = {
		input: {
			badge: t("sendCode"),
			title: t("welcomeToMoja"),
			description: t("signInDescription"),
		},
		otp: {
			badge: t("verify"),
			title: t("checkYourInbox"),
			description: t("enter6DigitCode", { identifier }),
		},
		profile: {
			badge: t("complete"),
			title: t("whatsYourName"),
			description: t("nameDisplayed"),
		},
	} as const;

	const { badge, title, description } = stepConfig[step];

	return (
		<AuthShell
			title={title}
			description={description}
			logoSource={require("@/assets/logo/moja-logo.png")}
		>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
					{step === "input" ? (
						<View className="gap-5">
							<AuthField
								label={t("emailOrPhone")}
								placeholder={t("emailPlaceholder")}
								autoCapitalize="none"
								keyboardType="email-address"
								value={identifier}
								onChangeText={setIdentifier}
							/>

							{message ? (
								<Text className="text-[13px] leading-[18px] text-primary">
									{message}
								</Text>
							) : null}

							<AuthButton
								label={t("sendCode")}
								pendingLabel={t("sendingCode")}
								isPending={isPending}
								onPress={handleSendCode}
							/>
						</View>
					) : null}

					{step === "otp" ? (
						<View className="gap-4">
						<View className="gap-2">
						<Text className="text-[14px] font-semibold text-foreground">
							{t("verifying")}
						</Text>
								<OtpInput
									numberOfDigits={6}
									type="numeric"
									autoFocus
									onTextChange={setOtp}
									onFilled={(text) => handleVerifyCode(text)}
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
											borderColor: "#ee237c",
										},
										pinCodeTextStyle: {
											color: "#171717",
											fontSize: 20,
											fontWeight: "700",
										},
										focusStickStyle: {
											backgroundColor: "#ee237c",
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
							label={t("verify")}
							pendingLabel={t("verifying")}
							isPending={isPending}
							onPress={handleVerifyCode}
						/>

						<AuthButton
							label={t("useDifferentMethod")}
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

					{step === "profile" ? (
						<View className="gap-4">
							<AuthField
								label={t("fullName")}
								placeholder={t("namePlaceholder")}
								autoCapitalize="words"
								value={fullName}
								onChangeText={setFullName}
							/>

							{message ? (
								<Text className="text-[13px] leading-[18px] text-primary">
									{message}
								</Text>
							) : null}

						<AuthButton
							label={t("complete")}
							pendingLabel={t("saving")}
							isPending={isPending}
							onPress={handleCompleteProfile}
						/>
						</View>
					) : null}
				</Animated.View>
			</KeyboardAvoidingView>
		</AuthShell>
	);
}
