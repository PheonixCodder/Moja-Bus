import { useState, useRef } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
	Bus,
	ShieldCheck,
	ArrowRight,
	ChevronLeft,
	KeyRound,
} from "lucide-react-native";
import { OtpInput } from "react-native-otp-entry";
import PhoneInput, { type ICountry } from "rn-international-phone-number";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import { authClient } from "@/lib/auth-client";
import { DriverFeedback } from "@/lib/haptics";

type AuthStep = "phone" | "otp";

/** Combines the locked +225 prefix with the local number entered by the user */
function buildE164(localNumber: string): string {
	const digits = localNumber.replace(/\D/g, "");
	return `+225${digits}`;
}

export default function DriverLoginScreen() {
	const router = useRouter();
	const { t } = useTranslation("auth");
	const [step, setStep] = useState<AuthStep>("phone");
	const [localPhone, setLocalPhone] = useState("");
	const [country, setCountry] = useState<ICountry | null>(null);
	const [otp, setOtp] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const slideAnim = useRef(new Animated.Value(0)).current;

	const animateForward = () => {
		slideAnim.setValue(40);
		Animated.timing(slideAnim, {
			toValue: 0,
			duration: 250,
			useNativeDriver: true,
		}).start();
	};

	const animateBackward = () => {
		slideAnim.setValue(-40);
		Animated.timing(slideAnim, {
			toValue: 0,
			duration: 250,
			useNativeDriver: true,
		}).start();
	};

	const formattedPhone = buildE164(localPhone);

	const handleSendOtp = async () => {
		if (!localPhone.trim()) {
			Toast.show({
				type: "error",
				text1: t("phoneRequired"),
				text2: t("phoneRequiredMsg"),
			});
			return;
		}

		try {
			setIsLoading(true);
			DriverFeedback.tap();

			const { error } = await authClient.phoneNumber.sendOtp({
				phoneNumber: formattedPhone,
			});

			if (error) {
				DriverFeedback.invalidScan();
				Toast.show({
					type: "error",
					text1: t("smsFailed"),
					text2: error.message || t("smsFailed"),
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
				text2: err.message || t("networkError"),
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleVerifyOtp = async (codeValue?: string) => {
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
			setIsLoading(true);
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
					text2: result.error.message || t("invalidCodeMsg"),
				});
				return;
			}

			DriverFeedback.successScan();
			Toast.show({
				type: "success",
				text1: t("verificationCleared"),
				text2: t("welcomeBack"),
			});

			router.replace("/(tabs)/trips");
		} catch (err: any) {
			DriverFeedback.invalidScan();
			Toast.show({
				type: "error",
				text1: t("networkError"),
				text2: err.message || t("networkError"),
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<SafeAreaView className="flex-1 bg-zinc-950">
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				className="flex-1"
			>
				<ScrollView
					contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
					className="px-6 py-8"
				>
					{/* Brand Header */}
					<View className="items-center mb-8">
						<View className="size-16 rounded-2xl bg-rose-600/10 border border-rose-500/20 items-center justify-center mb-4 shadow-xl shadow-rose-600/20">
							<Bus size={32} color="#e11d48" />
						</View>
						<Text className="text-2xl font-black text-white tracking-tight">
							{t("title")}
						</Text>
						<Text className="text-xs text-zinc-400 mt-1 text-center">
							{t("subtitle")}
						</Text>
					</View>

					<Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
						{step === "phone" ? (
							/* STEP 1: PHONE NUMBER INPUT — locked to Ivory Coast (+225) */
							<View className="space-y-4">
								<View className="space-y-1.5">
									<Text className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
										{t("phoneLabel")}
									</Text>
									{/* rn-international-phone-number locked to CI — modalDisabled hides country picker */}
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
												fontFamily:
													Platform.OS === "ios" ? "Menlo" : "monospace",
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
									<Text className="text-[11px] text-zinc-500 mt-1">
										{t("phoneHint")}
									</Text>
								</View>

								{/* Send Code Button */}
								<TouchableOpacity
									onPress={handleSendOtp}
									disabled={isLoading}
									className="bg-rose-600 active:bg-rose-700 rounded-2xl h-14 items-center justify-center mt-2 flex-row gap-2 shadow-xl shadow-rose-600/30"
								>
									{isLoading ? (
										<ActivityIndicator color="#ffffff" size="small" />
									) : (
										<>
											<Text className="text-white font-black text-sm">
												{t("sendCode")}
											</Text>
											<ArrowRight size={18} color="#ffffff" />
										</>
									)}
								</TouchableOpacity>

								{/* Self-registration button */}
								<TouchableOpacity
									onPress={() => router.push("/(auth)/register")}
									className="bg-zinc-900/60 border border-zinc-800 rounded-2xl h-14 items-center justify-center mt-2"
								>
									<Text className="text-zinc-300 font-bold text-xs">
										{t("registerCta")}
									</Text>
								</TouchableOpacity>
							</View>
						) : (
							/* STEP 2: 6-DIGIT OTP VERIFICATION */
							<View className="space-y-5">
								<TouchableOpacity
									onPress={() => {
										setStep("phone");
										animateBackward();
									}}
									className="flex-row items-center gap-1 mb-1"
								>
									<ChevronLeft size={16} color="#a1a1aa" />
									<Text className="text-xs text-zinc-400 font-medium">
										{t("changePhone")}
									</Text>
								</TouchableOpacity>

								<View>
									<Text className="text-lg font-black text-white tracking-tight">
										{t("verifyTitle")}
									</Text>
									<Text className="text-xs text-zinc-400 mt-0.5">
										{t("verifySubtitle")}{" "}
										<Text className="text-rose-400 font-mono font-bold">
											{formattedPhone}
										</Text>
									</Text>
								</View>

								{/* 6-Digit OTP Entry */}
								<View className="py-2">
									<OtpInput
										numberOfDigits={6}
										type="numeric"
										autoFocus
										onTextChange={setOtp}
										onFilled={(text) => handleVerifyOtp(text)}
										theme={{
											containerStyle: {
												width: "100%",
												gap: 6,
											},
											pinCodeContainerStyle: {
												flex: 1,
												minHeight: 54,
												aspectRatio: 1,
												borderRadius: 16,
												borderWidth: 1.5,
												borderColor: "#27272a",
												backgroundColor: "#18181b",
											},
											focusedPinCodeContainerStyle: {
												borderColor: "#e11d48",
												backgroundColor: "rgba(225, 29, 72, 0.08)",
											},
											pinCodeTextStyle: {
												color: "#fafafa",
												fontSize: 22,
												fontWeight: "800",
												fontFamily:
													Platform.OS === "ios" ? "Menlo" : "monospace",
											},
											focusStickStyle: {
												backgroundColor: "#e11d48",
											},
										}}
									/>
								</View>

								{/* Verify Button */}
								<TouchableOpacity
									onPress={() => handleVerifyOtp()}
									disabled={isLoading}
									className="bg-rose-600 active:bg-rose-700 rounded-2xl h-14 items-center justify-center mt-2 flex-row gap-2 shadow-xl shadow-rose-600/30"
								>
									{isLoading ? (
										<ActivityIndicator color="#ffffff" size="small" />
									) : (
										<>
											<KeyRound size={18} color="#ffffff" />
											<Text className="text-white font-black text-sm">
												{t("verifyButton")}
											</Text>
										</>
									)}
								</TouchableOpacity>

								{/* Resend Code Action */}
								<TouchableOpacity
									onPress={handleSendOtp}
									disabled={isLoading}
									className="items-center py-2"
								>
									<Text className="text-xs text-zinc-400 font-medium">
										{t("didNotReceive")}{" "}
										<Text className="text-rose-400 font-bold">{t("resendCode")}</Text>
									</Text>
								</TouchableOpacity>
							</View>
						)}
					</Animated.View>

					{/* Compliance Footer */}
					<View className="flex-row items-center justify-center gap-2 mt-10">
						<ShieldCheck size={16} color="#10b981" />
						<Text className="text-xs text-zinc-500">{t("complianceNote")}</Text>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
