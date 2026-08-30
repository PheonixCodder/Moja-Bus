import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
	Animated,
	Platform,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { OtpInput } from "react-native-otp-entry";
import PhoneInput, { type ICountry } from "rn-international-phone-number";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
	ArrowRight01Icon,
	ArrowLeft01Icon,
	Key01Icon,
	SecurityCheckIcon,
} from "@hugeicons/core-free-icons";
import Toast from "react-native-toast-message";

import { useQueryClient } from "@tanstack/react-query";
import { getTrpcClient, useTRPC } from "@/lib/trpc";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { AuthButton } from "@/features/auth/components/auth-button";
import { authClient, ensureAuthCookiesFresh } from "@/lib/auth-client";
import { DriverFeedback } from "@/lib/haptics";
import { colors } from "@/constants/theme";
import { useDriverRegistrationStore } from "@/stores/driver-registration";

/**
 * Maps Better Auth OTP error codes / English messages to French strings.
 * Better Auth returns English error text; this keeps the UI consistent with
 * the app's French-first locale.
 */
function toFrenchAuthError(message: string | undefined): string {
	if (!message) return "Une erreur est survenue. Veuillez réessayer.";
	const m = message.toLowerCase();
	if (m.includes("invalid otp") || m.includes("invalid code") || m.includes("otp not found"))
		return "Le code saisi est incorrect ou a expiré.";
	if (m.includes("otp expired") || m.includes("expired"))
		return "Ce code a expiré. Veuillez en demander un nouveau.";
	if (m.includes("too many") || m.includes("rate limit") || m.includes("rate_limit"))
		return "Trop de tentatives. Veuillez patienter avant de réessayer.";
	if (m.includes("phone") && m.includes("invalid"))
		return "Numéro de téléphone invalide.";
	if (m.includes("user not found") || m.includes("no user"))
		return "Aucun compte trouvé pour ce numéro.";
	if (m.includes("network") || m.includes("fetch"))
		return "Erreur réseau. Vérifiez votre connexion.";
	// Return the original if no mapping matched — better than hiding it
	return message;
}

type AuthStep = "phone" | "otp";

function buildE164(localNumber: string): string {
	const digits = localNumber.replace(/\D/g, "");
	if (digits.startsWith("225")) {
		return `+${digits}`;
	}
	return `+225${digits}`;
}

export default function LoginView() {
	const router = useRouter();
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
	const destination = returnTo ? decodeURIComponent(returnTo) : "/(tabs)/trips";

	const { data: session, isPending: sessionPending } = authClient.useSession();
	const { t } = useTranslation("auth");
	const [step, setStep] = useState<AuthStep>("phone");
	const [localPhone, setLocalPhone] = useState("");
	const [country, setCountry] = useState<ICountry | null>(null);
	const [otp, setOtp] = useState("");
	const [isPending, setIsPending] = useState(false);
	const slideAnim = useRef(new Animated.Value(0)).current;

	// On initial mount only — if already authenticated, let root index resolve driver state.
	// Using a ref so this never re-fires after isPending drops to false post-OTP.
	const initialSessionChecked = useRef(false);
	useEffect(() => {
		if (sessionPending) return;
		if (initialSessionChecked.current) return;
		initialSessionChecked.current = true;
		if (session?.user) {
			router.replace("/");
		}
	}, [sessionPending]); // eslint-disable-line react-hooks/exhaustive-deps

	function animateForward() {
		slideAnim.setValue(40);
		Animated.timing(slideAnim, {
			toValue: 0,
			duration: 250,
			useNativeDriver: true,
		}).start();
	}

	function animateBack() {
		slideAnim.setValue(-40);
		Animated.timing(slideAnim, {
			toValue: 0,
			duration: 250,
			useNativeDriver: true,
		}).start();
	}

	const formattedPhone = buildE164(localPhone);

	async function handleSendOtp() {
		if (!localPhone.trim()) {
			Toast.show({
				type: "error",
				text1: t("phoneRequired"),
				text2: t("phoneRequiredMsg"),
			});
			return;
		}

		try {
			setIsPending(true);
			DriverFeedback.tap();

			const { error } = await authClient.phoneNumber.sendOtp({
				phoneNumber: formattedPhone,
			});

			if (error) {
				DriverFeedback.invalidScan();
				Toast.show({
					type: "error",
					text1: t("smsFailed"),
					text2: toFrenchAuthError(error.message),
				});
				return;
			}

			DriverFeedback.tap();
			setStep("otp");
			animateForward();

			Toast.show({
				type: "success",
				text1: t("codeSent"),
				text2: `${t("codeSentMsg")} ${formattedPhone}`,
			});
		} catch (err: any) {
			DriverFeedback.invalidScan();
			Toast.show({
				type: "error",
				text1: t("networkError"),
				text2: err?.message || t("networkErrorHint"),
			});
		} finally {
			setIsPending(false);
		}
	}

	async function handleVerifyOtp(codeValue?: string) {
		const finalCode = codeValue ?? otp;
		if (!finalCode || finalCode.length < 6) {
			Toast.show({
				type: "error",
				text1: t("incompleteCode"),
				text2: t("incompleteCodeMsg"),
			});
			return;
		}

		try {
			setIsPending(true);
			DriverFeedback.tap();

			const result = await authClient.phoneNumber.verify({
				phoneNumber: formattedPhone,
				code: finalCode,
			});

			if (result.error) {
				DriverFeedback.invalidScan();
				Toast.show({
					type: "error",
					text1: t("invalidCode"),
					text2: toFrenchAuthError(result.error.message),
				});
				return;
			}

			DriverFeedback.successScan();

			// Flush auth cookie into memory before making the tRPC call,
			// otherwise getCookie() may still return empty right after verify.
			await ensureAuthCookiesFresh();

			// Smart routing based on driver profile verification status
			const trpcClient = getTrpcClient();
			const statusData = await trpcClient.drivers.getMyVerificationStatus
				.query()
				.catch(() => null);

			if (!statusData?.driver) {
				useDriverRegistrationStore.getState().updateData({
					phone: formattedPhone,
					currentStep: 1,
					verifiedAt: new Date().toISOString(),
				});
				router.replace("/(auth)/register");
				return;
			}

			if (statusData.driver.verificationStatus !== "VERIFIED") {
				router.replace("/(auth)/register/status");
				return;
			}

			Toast.show({
				type: "success",
				text1: t("verificationCleared"),
				text2: t("welcomeBack"),
			});

			router.replace(destination as any);
		} catch (err: any) {
			DriverFeedback.invalidScan();
			Toast.show({
				type: "error",
				text1: t("networkError"),
				text2: err?.message || t("validationErrorHint"),
			});
		} finally {
			setIsPending(false);
		}
	}

	return (
		<AuthShell
			badge={t("badge")}
			title={step === "phone" ? t("title") : t("verifyTitle")}
			description={
				step === "phone"
					? t("subtitle")
					: `${t("verifySubtitle")} ${formattedPhone}`
			}
			logoSource={require("@/assets/images/icon.png")}
			footer={
				<View style={styles.footerRow}>
					<HugeiconsIcon icon={SecurityCheckIcon} size={16} color="#10b981" />
					<Text style={styles.footerText}>
						{t("complianceNote")}
					</Text>
				</View>
			}
		>
			<Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
				{step === "phone" ? (
					<View style={styles.stepContainer}>
						<View style={styles.inputGroup}>
							<Text style={styles.inputLabel}>{t("phoneLabel")}</Text>
							<PhoneInput
								defaultCountry="CI"
								value={localPhone}
								onChangePhoneNumber={setLocalPhone}
								country={country}
								onChangeCountry={setCountry}
								modalDisabled
								phoneInputStyles={{
									container: {
										backgroundColor: "#18181b",
										borderWidth: 1,
										borderColor: "#27272a",
										borderRadius: 16,
										height: 56,
									},
									flagContainer: {
										backgroundColor: "transparent",
										borderRightWidth: 1,
										borderRightColor: "#27272a",
									},
									input: {
										color: "#fafafa",
										fontSize: 16,
										fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
										backgroundColor: "transparent",
									},
									callingCode: {
										color: "#a1a1aa",
										fontSize: 15,
									},
								}}
								phoneInputPlaceholderTextColor="#52525b"
								placeholder={t("phonePlaceholder")}
							/>
							<Text style={styles.inputHint}>
								{t("phoneHint")}
							</Text>
						</View>

						<AuthButton
							title={t("sendCode")}
							variant="primary"
							loading={isPending}
							onPress={handleSendOtp}
							icon={<HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#ffffff" />}
							iconPosition="right"
						/>
					</View>
				) : (
					<View style={styles.stepContainer}>
						<TouchableOpacity
							onPress={() => {
								DriverFeedback.tap();
								setStep("phone");
								animateBack();
							}}
							style={styles.backButton}
						>
							<HugeiconsIcon icon={ArrowLeft01Icon} size={16} color="#a1a1aa" />
							<Text style={styles.backButtonText}>{t("changePhone")}</Text>
						</TouchableOpacity>

						<View style={styles.otpWrapper}>
							<OtpInput
								numberOfDigits={6}
								type="numeric"
								autoFocus
								onTextChange={setOtp}
								onFilled={(text) => handleVerifyOtp(text)}
								theme={{
									containerStyle: {
										width: "100%",
										gap: 8,
									},
									pinCodeContainerStyle: {
										flex: 1,
										minHeight: 52,
										aspectRatio: 1,
										borderRadius: 14,
										borderWidth: 1.5,
										borderColor: "#27272a",
										backgroundColor: "#18181b",
									},
									focusedPinCodeContainerStyle: {
										borderColor: colors.primary.rose,
										backgroundColor: "rgba(238, 35, 124, 0.08)",
									},
									pinCodeTextStyle: {
										color: "#fafafa",
										fontSize: 20,
										fontWeight: "800",
										fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
									},
									focusStickStyle: {
										backgroundColor: colors.primary.rose,
									},
								}}
							/>
						</View>

						<AuthButton
							title={t("verifyButton")}
							variant="primary"
							loading={isPending}
							onPress={() => handleVerifyOtp()}
							icon={<HugeiconsIcon icon={Key01Icon} size={18} color="#ffffff" />}
							iconPosition="left"
						/>

						<TouchableOpacity
							onPress={handleSendOtp}
							disabled={isPending}
							style={styles.resendButton}
						>
							<Text style={styles.resendText}>
								{t("didNotReceive")}{" "}
								<Text style={styles.resendHighlight}>{t("resendCode")}</Text>
							</Text>
						</TouchableOpacity>
					</View>
				)}
			</Animated.View>
		</AuthShell>
	);
}

const styles = StyleSheet.create({
	loadingContainer: {
		flex: 1,
		backgroundColor: "#09090b",
		alignItems: "center",
		justifyContent: "center",
	},
	stepContainer: {
		gap: 20,
	},
	inputGroup: {
		gap: 8,
	},
	inputLabel: {
		fontSize: 12,
		fontWeight: "700",
		color: "#d4d4d8",
		textTransform: "uppercase",
		letterSpacing: 1,
	},
	inputHint: {
		fontSize: 11,
		color: "#71717a",
	},
	backButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingVertical: 4,
		alignSelf: "flex-start",
	},
	backButtonText: {
		fontSize: 12,
		fontWeight: "600",
		color: "#a1a1aa",
	},
	otpWrapper: {
		paddingVertical: 8,
	},
	resendButton: {
		alignItems: "center",
		paddingVertical: 8,
	},
	resendText: {
		fontSize: 12,
		color: "#a1a1aa",
	},
	resendHighlight: {
		color: "#ee237c",
		fontWeight: "700",
	},
	footerRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		paddingTop: 12,
	},
	footerText: {
		fontSize: 11,
		color: "#71717a",
		fontWeight: "500",
	},
});
