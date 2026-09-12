import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import {
	ActivityIndicator,
	Animated,
	StyleSheet,
	Switch,
	Text,
	View,
} from "react-native";
import { OtpInput } from "react-native-otp-entry";

import { AuthButton } from "@/features/auth/components/auth-button";
import { AuthField } from "@/features/auth/components/auth-field";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { authClient, refreshSession } from "@/lib/auth-client";
import { useTRPC } from "@/lib/trpc";
import { Palette, Colors } from "@/constants/theme";

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
	const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
	const destination = returnTo ? decodeURIComponent(returnTo) : "/(tabs)";

	const { data: session, isPending: sessionPending } = authClient.useSession();
	const { t } = useTranslation("auth");
	const trpc = useTRPC();
	const [step, setStep] = useState<AuthStep>("input");
	const [identifier, setIdentifier] = useState("");
	const [method, setMethod] = useState<"phone" | "email">("email");
	const [otp, setOtp] = useState("");
	const [fullName, setFullName] = useState("");
	const [preferredSeat, setPreferredSeat] = useState<"WINDOW" | "AISLE" | "NONE">("NONE");
	const [preferredClass, setPreferredClass] = useState<"ECONOMY" | "STANDARD" | "VIP">("ECONOMY");
	const [marketingOptIn, setMarketingOptIn] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
		const updatePreferencesMutation = useMutation(
		trpc.passenger.updatePreferences.mutationOptions({
			onSuccess: () => {},
			onError: (err) => {
				setMessage(err.message || t("failedToUpdate"));
				setIsPendingLocal(false);
			},
		}),
	);

	const [isPendingLocal, setIsPendingLocal] = useState(false);
	const slideAnim = useRef(new Animated.Value(0)).current;

	const isPending =
		isPendingLocal ||
		updatePreferencesMutation.isPending;

	// Redirect already-authenticated users away
	useEffect(() => {
		if (!sessionPending && session?.user) {
			router.replace(destination as any);
		}
	}, [sessionPending, session?.user, destination, router]);

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
		setMessage(null);
		const detected = detectMethod(identifier);
		setMethod(detected);

		let finalIdentifier = identifier.trim();
		if (detected === "phone" && !finalIdentifier.startsWith("+")) {
			if (finalIdentifier.length === 10) {
				finalIdentifier = `+225${finalIdentifier}`;
			}
		}

		setIsPendingLocal(true);
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
			setMessage(getAuthError(err).message || t("failedToSend"));
		} finally {
			setIsPendingLocal(false);
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

		setIsPendingLocal(true);
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

			try {
				await refreshSession();
			} catch {}

			const isNewUser =
				new Date(result.data.user.createdAt).getTime() > Date.now() - 10000;
			const user = result.data.user;
			const isExistingTravelerMissingName =
				user.role === "TRAVELER" && !user.name;

			if (isNewUser || isExistingTravelerMissingName) {
				setStep("profile");
				animateForward();
			} else {
				router.replace(destination as any);
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
			setIsPendingLocal(false);
		}
	}

	async function handleCompleteProfile() {
		if (!fullName.trim() || fullName.trim().length < 2) {
			setMessage(t("fullNameRequired"));
			return;
		}

		setMessage(null);
		setIsPendingLocal(true);
		try {
			const { error } = await authClient.updateUser({
				name: fullName.trim(),
			});
			if (error) throw error;

			updatePreferencesMutation.mutate(
				{
					fullName: fullName.trim(),
					preferredSeat,
					preferredClass,
					marketingOptIn,
				},
				{
					onSuccess: () => {
						try {
							refreshSession();
						} catch {}
						router.replace(destination as any);
					},
					onError: (err) => {
						setMessage(err.message || t("failedToUpdate"));
						setIsPendingLocal(false);
					},
				},
			);
		} catch (err) {
			setMessage(getAuthError(err).message || t("failedToUpdate"));
			setIsPendingLocal(false);
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
			title: t("profileHeading"),
			description: t("profileDescription"),
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

						<View className="gap-1">
							<Text className="text-[14px] font-semibold text-foreground">
								{t("profileSeatLabel")}
							</Text>
							<Select
								value={
									preferredSeat
										? {
												value: preferredSeat,
												label:
													preferredSeat === "WINDOW"
														? t("profileSeatWindow")
														: preferredSeat === "AISLE"
															? t("profileSeatAisle")
															: t("profileSeatNone"),
											}
										: undefined
								}
								onValueChange={(option) => {
									if (option?.value) {
										setPreferredSeat(option.value as "NONE" | "WINDOW" | "AISLE");
									}
								}}
								disabled={isPending}
							>
								<SelectTrigger className="h-11 w-full rounded-[18px] border border-[rgba(238,35,124,0.3)] bg-[rgba(238,35,124,0.05)] px-4">
									<SelectValue
										placeholder={t("profileSeatNone")}
									/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="NONE" label={t("profileSeatNone")}>
										{t("profileSeatNone")}
									</SelectItem>
									<SelectItem value="WINDOW" label={t("profileSeatWindow")}>
										{t("profileSeatWindow")}
									</SelectItem>
									<SelectItem value="AISLE" label={t("profileSeatAisle")}>
										{t("profileSeatAisle")}
									</SelectItem>
								</SelectContent>
							</Select>
						</View>

						<View className="gap-1">
							<Text className="text-[14px] font-semibold text-foreground">
								{t("profileClassLabel")}
							</Text>
							<Select
								value={
									preferredClass
										? {
												value: preferredClass,
												label:
													preferredClass === "VIP"
														? t("profileClassVip")
														: preferredClass === "STANDARD"
															? t("profileClassStandard")
															: t("profileClassEconomy"),
											}
										: undefined
								}
								onValueChange={(option) => {
									if (option?.value) {
										setPreferredClass(option.value as "ECONOMY" | "STANDARD" | "VIP");
									}
								}}
								disabled={isPending}
							>
								<SelectTrigger className="h-11 w-full rounded-[18px] border border-[rgba(238,35,124,0.3)] bg-[rgba(238,35,124,0.05)] px-4">
									<SelectValue
										placeholder={t("profileClassEconomy")}
									/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="ECONOMY" label={t("profileClassEconomy")}>
										{t("profileClassEconomy")}
									</SelectItem>
									<SelectItem value="STANDARD" label={t("profileClassStandard")}>
										{t("profileClassStandard")}
									</SelectItem>
									<SelectItem value="VIP" label={t("profileClassVip")}>
										{t("profileClassVip")}
									</SelectItem>
								</SelectContent>
							</Select>
						</View>

						<View className="flex-row items-center justify-between gap-4">
							<View className="flex-1">
								<Text className="text-[14px] font-semibold text-foreground">
									{t("profileMarketingLabel")}
								</Text>
								<Text className="text-[12px] leading-[16px] text-muted-foreground">
									{t("profileMarketingDesc")}
								</Text>
							</View>
							<Switch
								value={marketingOptIn}
								onValueChange={setMarketingOptIn}
								disabled={isPending}
							/>
						</View>

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
