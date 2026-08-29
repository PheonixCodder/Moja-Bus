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
import { useTRPC } from "@/lib/trpc";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { AuthButton } from "@/features/auth/components/auth-button";
import { authClient } from "@/lib/auth-client";
import { DriverFeedback } from "@/lib/haptics";
import { colors } from "@/constants/theme";

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

	useEffect(() => {
		if (!sessionPending && session?.user) {
			router.replace(destination as any);
		}
	}, [sessionPending, session?.user, destination, router]);

	if (sessionPending || session?.user) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#ee237c" />
			</View>
		);
	}

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
				text1: t("phoneRequired") || "Numéro requis",
				text2: t("phoneRequiredMsg") || "Veuillez saisir votre numéro de téléphone",
			});
			return;
		}

		try {
			setIsPending(true);
			DriverFeedback.tap();

			// Strict Login Gate: Pre-check if driver account exists before sending OTP
			const checkResult = await queryClient.fetchQuery(
				trpc.drivers.checkDriverAccountStatus.queryOptions({
					phone: formattedPhone,
				})
			);

			if (!checkResult.exists || !checkResult.isDriver) {
				DriverFeedback.invalidScan();
				Toast.show({
					type: "error",
					text1: "Compte chauffeur introuvable",
					text2: "Ce numéro n'est pas enregistré. Cliquez sur Inscription ci-dessous.",
				});
				return;
			}

			const { error } = await authClient.phoneNumber.sendOtp({
				phoneNumber: formattedPhone,
			});

			if (error) {
				DriverFeedback.invalidScan();
				Toast.show({
					type: "error",
					text1: t("smsFailed") || "Échec d'envoi",
					text2: error.message || t("smsFailed") || "Impossible d'envoyer le code",
				});
				return;
			}

			DriverFeedback.tap();
			setStep("otp");
			animateForward();

			Toast.show({
				type: "success",
				text1: t("codeSent") || "Code envoyé",
				text2: `${t("codeSentMsg") || "Code transmis au"} ${formattedPhone}`,
			});
		} catch (err: any) {
			DriverFeedback.invalidScan();
			Toast.show({
				type: "error",
				text1: t("networkError") || "Erreur réseau",
				text2: err?.message || "Vérifiez votre connexion",
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
				text1: t("incompleteCode") || "Code incomplet",
				text2: t("incompleteCodeMsg") || "Veuillez entrer les 6 chiffres",
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
					text1: t("invalidCode") || "Code invalide",
					text2: result.error.message || "Code OTP incorrect",
				});
				return;
			}

			DriverFeedback.successScan();

			// Smart routing based on driver profile verification status
			const statusData = await queryClient
				.fetchQuery(trpc.drivers.getMyVerificationStatus.queryOptions())
				.catch(() => null);

			if (!statusData?.driver) {
				router.replace("/(auth)/register");
				return;
			}

			if (statusData.driver.verificationStatus !== "VERIFIED") {
				router.replace("/(auth)/register/status");
				return;
			}

			Toast.show({
				type: "success",
				text1: t("verificationCleared") || "Vérifié",
				text2: t("welcomeBack") || "Bienvenue sur Moja Driver",
			});

			router.replace(destination as any);
		} catch (err: any) {
			DriverFeedback.invalidScan();
			Toast.show({
				type: "error",
				text1: t("networkError") || "Erreur réseau",
				text2: err?.message || "Erreur lors de la validation",
			});
		} finally {
			setIsPending(false);
		}
	}

	return (
		<AuthShell
			badge="Accès Chauffeur"
			title={step === "phone" ? t("title") || "Connexion Chauffeur" : t("verifyTitle") || "Vérification OTP"}
			description={
				step === "phone"
					? t("subtitle") || "Entrez votre numéro pour accéder à vos dispatches et votre HUD de conduite."
					: `${t("verifySubtitle") || "Entrez le code envoyé au"} ${formattedPhone}`
			}
			logoSource={require("@/assets/images/icon.png")}
			footer={
				<View style={styles.footerRow}>
					<HugeiconsIcon icon={SecurityCheckIcon} size={16} color="#10b981" />
					<Text style={styles.footerText}>
						{t("complianceNote") || "Plateforme certifiée de transport en Côte d'Ivoire"}
					</Text>
				</View>
			}
		>
			<Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
				{step === "phone" ? (
					<View style={styles.stepContainer}>
						<View style={styles.inputGroup}>
							<Text style={styles.inputLabel}>{t("phoneLabel") || "Numéro de téléphone"}</Text>
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
								placeholder={t("phonePlaceholder") || "07 00 00 00 00"}
							/>
							<Text style={styles.inputHint}>
								{t("phoneHint") || "Entrez votre numéro enregistré auprès de votre compagnie."}
							</Text>
						</View>

						<AuthButton
							title={t("sendCode") || "Recevoir le code SMS"}
							variant="primary"
							loading={isPending}
							onPress={handleSendOtp}
							icon={<HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#ffffff" />}
							iconPosition="right"
						/>

						<AuthButton
							title={t("registerCta") || "Nouveau chauffeur ? Inscription"}
							variant="outline"
							onPress={() => router.push("/(auth)/register" as any)}
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
							<Text style={styles.backButtonText}>{t("changePhone") || "Modifier le numéro"}</Text>
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
							title={t("verifyButton") || "Valider & Démarrer"}
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
								{t("didNotReceive") || "Code non reçu ?"}{" "}
								<Text style={styles.resendHighlight}>{t("resendCode") || "Renvoyer"}</Text>
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
