import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
	View,
	Text,
	Image,
	Alert,
	Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
	Camera01Icon,
	User02Icon,
	Call02Icon,
	Award01Icon,
	ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { useDriverRegistrationStore } from "@/stores/driver-registration";
import { DriverFeedback } from "@/lib/haptics";
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/lib/trpc";
import { uploadCapturedDocument } from "@/lib/driver-doc-upload";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { colors } from "@/constants/theme";

export default function RegisterStep1Screen() {
	const { t } = useTranslation("auth");
	const router = useRouter();
	const { data: session } = authClient.useSession();
	const trpc = useTRPC();
	const presign = useMutation(trpc.storage.presignUpload.mutationOptions());

	const {
		fullName,
		phone,
		yearsOfExperience,
		profileSelfieUri,
		profileSelfieLocalPreview,
		updateData,
	} = useDriverRegistrationStore();

	const sessionPhone = (session?.user as any)?.phoneNumber || (session?.user as any)?.phone || "";
	const effectivePhone = phone || sessionPhone || "";

	useEffect(() => {
		if (effectivePhone) {
			updateData({
				currentStep: 1,
				phone: effectivePhone,
				verifiedAt: useDriverRegistrationStore.getState().verifiedAt ?? new Date().toISOString(),
			});
		}
	}, [effectivePhone, updateData]);

	// Do NOT fall back to session?.user?.name — Better Auth sets it to
	// "User {phone}" for phone-OTP signups, which would pre-fill a garbage value.
	// Only restore what the driver explicitly typed (persisted in the store).
	const [nameInput, setNameInput] = useState(fullName || "");
	const [expInput, setExpInput] = useState(String(yearsOfExperience || 3));
	const [selfieUri, setSelfieUri] = useState<string | null>(
		profileSelfieLocalPreview || (profileSelfieUri && !profileSelfieUri.startsWith("documents/") ? profileSelfieUri : null)
	);
	const [selfieKey, setSelfieKey] = useState<string | null>(
		profileSelfieUri?.startsWith("documents/") ? profileSelfieUri : null
	);

	const handleTakeSelfie = async () => {
		DriverFeedback.tap();
		const { status } = await ImagePicker.requestCameraPermissionsAsync();
		if (status !== "granted") {
			Alert.alert(t("cameraPermission"), t("cameraPermissionMsg"));
			return;
		}

		const result = await ImagePicker.launchCameraAsync({
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.7,
		});

		if (!result.canceled && result.assets?.[0]?.uri) {
			const localUri = result.assets[0].uri;
			setSelfieUri(localUri);

			const storedKey = await uploadCapturedDocument({
				presign: presign.mutateAsync as never,
				localUri,
				fileName: "selfie.jpg",
				purpose: "driver-selfie",
			});
			if (!storedKey) {
				Alert.alert(
					t("selfieUploadFailed"),
					t("selfieUploadFailedMsg"),
				);
				return;
			}
			setSelfieKey(storedKey);
			updateData({
				profileSelfieUri: storedKey,
				profileSelfieLocalPreview: localUri,
			});
		}
	};

	const handleNext = () => {
		if (!nameInput.trim()) {
			Alert.alert(t("fieldRequired"), t("fullNameRequiredMsg"));
			return;
		}
		if (!effectivePhone.trim()) {
			Alert.alert(t("fieldRequired"), t("phoneRequiredStep1"));
			return;
		}
		if (selfieUri && !selfieKey) {
			Alert.alert(
				t("selfieNotUploaded"),
				t("selfieNotUploadedMsg"),
			);
			return;
		}

		DriverFeedback.tap();
		updateData({
			fullName: nameInput.trim(),
			phone: effectivePhone.trim(),
			yearsOfExperience: parseInt(expInput, 10) || 1,
			profileSelfieUri: selfieKey || profileSelfieUri,
			profileSelfieLocalPreview: selfieUri || profileSelfieLocalPreview,
			currentStep: 2,
		});

		router.push("/(auth)/register/license");
	};

	return (
		<ScreenShell
			header={
				<View>
					<PageHeader
						title={t("step1Title")}
						subtitle={t("step1Subtitle")}
						showBack={false}
					/>
					{/* Progress Indicator */}
					<View className="h-1 bg-card w-full">
						<View className="h-full bg-primary w-1/4" />
					</View>
				</View>
			}
			footer={
				<Button
					title={t("continueToLicense")}
					variant="primary"
					size="lg"
					onPress={handleNext}
					icon={<HugeiconsIcon icon={ArrowRight01Icon} size={18} color={colors.neutral.textPrimary} />}
					iconPosition="right"
				/>
			}
		>
			<View className="gap-4">
				<Card className="p-5 gap-3">
					<Text className="text-base font-extrabold text-foreground tracking-tight">{t("selfieSectionTitle")}</Text>
					<Text className="text-xs text-muted-foreground leading-5">
						{t("selfieSectionSubtitle")}
					</Text>

					<View className="items-center py-2">
						{selfieUri || selfieKey ? (
							<View className="items-center gap-2.5">
								{selfieUri ? (
									<Image source={{ uri: selfieUri }} className="w-28 h-28 rounded-full border-2 border-primary" />
								) : (
									<View className="w-28 h-28 rounded-full bg-card items-center justify-center border-2 border-success/40 gap-1.5">
										<HugeiconsIcon icon={Camera01Icon} size={32} color={colors.semantic.success} />
										<Text className="text-[10px] font-bold text-success">{t("selfieUploaded", "Photo enregistrée")}</Text>
									</View>
								)}
								<Button
									title={t("retake")}
									variant="secondary"
									size="sm"
									onPress={handleTakeSelfie}
									icon={<HugeiconsIcon icon={Camera01Icon} size={16} color={colors.neutral.textPrimary} />}
								/>
							</View>
						) : (
							<Button
								variant="outline"
								size="lg"
								onPress={handleTakeSelfie}
								className="w-full h-36 border-2 border-dashed border-border rounded-2xl items-center justify-center bg-card/50"
								title={t("takeSelfie")}
								icon={
									<View className="w-12 h-12 rounded-full bg-primary/15 items-center justify-center mb-1">
										<HugeiconsIcon icon={Camera01Icon} size={28} color={colors.primary.rose} />
									</View>
								}
							/>
						)}
					</View>
				</Card>

				<Card className="p-5 gap-3">
					<Text className="text-base font-extrabold text-foreground tracking-tight">{t("personalInfoTitle")}</Text>

					<View className="gap-4 pt-1">
						<Input
							label={t("fullNameOfficiel")}
							placeholder={t("fullNameExample")}
							value={nameInput}
							onChangeText={setNameInput}
							leftIcon={<HugeiconsIcon icon={User02Icon} size={18} color={colors.neutral.textMuted} />}
						/>

						<Input
							label={t("phoneVerifiedLabel")}
							placeholder={t("phoneExample")}
							keyboardType="phone-pad"
							value={effectivePhone}
							editable={false}
							leftIcon={<HugeiconsIcon icon={Call02Icon} size={18} color={colors.semantic.success} />}
						/>

						<Input
							label={t("experienceLabel")}
							placeholder={t("experienceExample")}
							keyboardType="number-pad"
							value={expInput}
							onChangeText={setExpInput}
							leftIcon={<HugeiconsIcon icon={Award01Icon} size={18} color={colors.neutral.textMuted} />}
						/>
					</View>
				</Card>
			</View>
		</ScreenShell>
	);
}
