import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
	View,
	Text,
	Image,
	Alert,
	TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
	IdentityCardIcon,
	HealthIcon,
	SecurityCheckIcon,
	ArrowRight01Icon,
	CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { useDriverRegistrationStore } from "@/stores/driver-registration";
import { useWizardGuard } from "@/hooks/use-wizard-guard";
import { DriverFeedback } from "@/lib/haptics";
import { useTRPC } from "@/lib/trpc";
import { uploadCapturedDocument } from "@/lib/driver-doc-upload";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { colors } from "@/constants/theme";

export default function RegisterStep3DocumentsScreen() {
	const { t } = useTranslation("auth");
	const router = useRouter();
	useWizardGuard(3);

	const {
		nationalIdNumber,
		medicalDocUri,
		medicalDocLocalPreview,
		updateData,
	} = useDriverRegistrationStore();

	useEffect(() => {
		updateData({ currentStep: 3 });
	}, [updateData]);
	const trpc = useTRPC();
	const presign = useMutation(trpc.storage.presignUpload.mutationOptions());

	const [idInput, setIdInput] = useState(nationalIdNumber);
	const [medicalUri, setMedicalUri] = useState<string | null>(
		medicalDocLocalPreview || (medicalDocUri && !medicalDocUri.startsWith("documents/") ? medicalDocUri : null)
	);
	const [medicalKey, setMedicalKey] = useState<string | null>(
		medicalDocUri?.startsWith("documents/") ? medicalDocUri : null,
	);

	const handleCaptureMedical = async () => {
		DriverFeedback.tap();
		const { status } = await ImagePicker.requestCameraPermissionsAsync();
		if (status !== "granted") {
			Alert.alert(t("cameraPermission"), t("medicalCameraMsg"));
			return;
		}

		const result = await ImagePicker.launchCameraAsync({
			allowsEditing: true,
			aspect: [4, 3],
			quality: 0.7,
		});

		if (!result.canceled && result.assets?.[0]?.uri) {
			const localUri = result.assets[0].uri;
			setMedicalUri(localUri);

			const storedKey = await uploadCapturedDocument({
				presign: presign.mutateAsync as never,
				localUri,
				fileName: "medical-certificate.jpg",
				purpose: "driver-medical-doc",
			});
			if (!storedKey) {
				Alert.alert(
					t("selfieUploadFailed"),
					t("selfieUploadFailedMsg"),
				);
				return;
			}
			setMedicalKey(storedKey);
			updateData({
				medicalDocUri: storedKey,
				medicalDocLocalPreview: localUri,
			});
		}
	};

	const handleNext = () => {
		if (!idInput.trim()) {
			Alert.alert(t("fieldRequired"), t("cniRequired"));
			return;
		}
		if (medicalUri && !medicalKey) {
			Alert.alert(
				t("medicalNotUploaded"),
				t("medicalNotUploadedMsg"),
			);
			return;
		}

		DriverFeedback.tap();
		updateData({
			nationalIdNumber: idInput.trim(),
			medicalDocUri: medicalKey || medicalDocUri,
			medicalDocLocalPreview: medicalUri || medicalDocLocalPreview,
			currentStep: 4,
		});

		router.push("/(auth)/register/carrier");
	};

	return (
		<ScreenShell
			header={
				<View>
					<PageHeader
						title={t("step3Title")}
						subtitle={t("step3Subtitle")}
						showBack
						onBack={() => router.replace("/(auth)/register/license")}
					/>
					<View className="h-1 bg-card w-full">
						<View className="h-full bg-primary w-3/4" />
					</View>
				</View>
			}
			footer={
				<Button
					title={t("continueToCarrier")}
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
					<Text className="text-base font-extrabold text-foreground tracking-tight">{t("cniTitle")}</Text>
					<Text className="text-xs text-muted-foreground leading-5">
						{t("cniSubtitle")}
					</Text>

					<View className="pt-1">
						<Input
							label={t("cniNumberLabel")}
							placeholder={t("cniNumberPlaceholder")}
							value={idInput}
							onChangeText={setIdInput}
							leftIcon={<HugeiconsIcon icon={IdentityCardIcon} size={18} color={colors.neutral.textMuted} />}
						/>
					</View>
				</Card>

				<Card className="p-5 gap-3">
					<View className="flex-row items-center justify-between">
						<Text className="text-base font-extrabold text-foreground tracking-tight">{t("medicalTitle")}</Text>
						<View className="bg-primary/15 px-2.5 py-1 rounded-full">
							<Text className="text-[10px] font-bold text-primary uppercase">{t("medicalOptionalBadge")}</Text>
						</View>
					</View>
					<Text className="text-xs text-muted-foreground leading-5">
						{t("medicalSubtitle")}
					</Text>

					<View className="pt-1">
						{medicalUri || medicalKey ? (
							<Button
								variant="outline"
								onPress={handleCaptureMedical}
								className="relative h-32 w-full p-0 rounded-2xl overflow-hidden border-border"
							>
								{medicalUri ? (
									<Image source={{ uri: medicalUri }} className="w-full h-full" />
								) : (
									<View className="w-full h-full bg-card items-center justify-center">
										<HugeiconsIcon icon={CheckmarkCircle02Icon} size={28} color={colors.semantic.success} />
										<Text className="text-xs font-bold text-success mt-1">
											{t("medicalUploaded")}
										</Text>
									</View>
								)}
								<View className="absolute bottom-2.5 right-2.5 flex-row items-center gap-1.5 bg-card/90 px-3 py-1.5 rounded-full border border-border">
									<HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} color={colors.semantic.success} />
									<Text className="text-xs font-bold text-foreground">{t("medicalUploaded")}</Text>
								</View>
							</Button>
						) : (
							<Button
								variant="outline"
								onPress={handleCaptureMedical}
								className="h-32 w-full border-1.5 border-dashed border-border rounded-2xl items-center justify-center bg-background gap-1.5 flex-col"
							>
								<View className="w-11 h-11 rounded-full bg-primary/15 items-center justify-center">
									<HugeiconsIcon icon={HealthIcon} size={26} color={colors.primary.rose} />
								</View>
								<Text className="text-sm font-bold text-foreground">{t("scanMedical")}</Text>
								<Text className="text-xs text-muted-foreground">{t("medicalHint")}</Text>
							</Button>
						)}
					</View>
				</Card>

				<View className="flex-row gap-3 bg-success/10 border border-success/20 rounded-2xl p-4">
					<HugeiconsIcon icon={SecurityCheckIcon} size={20} color={colors.semantic.success} />
					<View className="flex-1 gap-1">
						<Text className="text-sm font-bold text-success">{t("privacyTitle")}</Text>
						<Text className="text-xs text-muted-foreground leading-4">
							{t("privacyDesc")}
						</Text>
					</View>
				</View>
			</View>
		</ScreenShell>
	);
}
