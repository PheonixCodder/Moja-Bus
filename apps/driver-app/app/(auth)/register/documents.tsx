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
	IdentityCardIcon,
	HealthIcon,
	SecurityCheckIcon,
	ArrowRight01Icon,
	CheckmarkCircle02Icon,
	Camera01Icon,
	CreditCardIcon,
	Calendar01Icon,
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
		licenseCategory,
		licenseCategories,
		nationalIdNumber,
		medicalDocUri,
		medicalDocLocalPreview,
		cacrNumber,
		cacrExpiryDate,
		cacrFrontUri,
		cacrFrontLocalPreview,
		cacrBackUri,
		cacrBackLocalPreview,
		updateData,
	} = useDriverRegistrationStore();

	const categories = licenseCategories?.length
		? licenseCategories
		: [licenseCategory || "D"];
	const requiresCacr = categories.some((c) => ["C", "D", "E"].includes(c));

	useEffect(() => {
		updateData({ currentStep: 3 });
	}, [updateData]);

	const trpc = useTRPC();
	const presign = useMutation(trpc.storage.presignUpload.mutationOptions());
	const saveStep = useMutation(trpc.drivers.saveOnboardingStep.mutationOptions());

	const [idInput, setIdInput] = useState(nationalIdNumber);
	const [medicalUri, setMedicalUri] = useState<string | null>(
		medicalDocLocalPreview || (medicalDocUri && !medicalDocUri.startsWith("documents/") ? medicalDocUri : null)
	);
	const [medicalKey, setMedicalKey] = useState<string | null>(
		medicalDocUri?.startsWith("documents/") ? medicalDocUri : null,
	);

	const [cacrNumberInput, setCacrNumberInput] = useState(cacrNumber || "");
	const [cacrExpiryInput, setCacrExpiryInput] = useState(cacrExpiryDate || "");
	const [cacrFrontUriState, setCacrFrontUriState] = useState<string | null>(
		cacrFrontLocalPreview || (cacrFrontUri && !cacrFrontUri.startsWith("documents/") ? cacrFrontUri : null)
	);
	const [cacrBackUriState, setCacrBackUriState] = useState<string | null>(
		cacrBackLocalPreview || (cacrBackUri && !cacrBackUri.startsWith("documents/") ? cacrBackUri : null)
	);
	const [cacrFrontKey, setCacrFrontKey] = useState<string | null>(
		cacrFrontUri?.startsWith("documents/") ? cacrFrontUri : null,
	);
	const [cacrBackKey, setCacrBackKey] = useState<string | null>(
		cacrBackUri?.startsWith("documents/") ? cacrBackUri : null,
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

	const handleCaptureCacr = async (side: "front" | "back") => {
		DriverFeedback.tap();
		const { status } = await ImagePicker.requestCameraPermissionsAsync();
		if (status !== "granted") {
			Alert.alert(t("cameraPermission"), t("cameraPermissionMsg", "Accès à la caméra requis"));
			return;
		}

		const result = await ImagePicker.launchCameraAsync({
			allowsEditing: true,
			aspect: [4, 3],
			quality: 0.7,
		});

		if (!result.canceled && result.assets?.[0]?.uri) {
			const localUri = result.assets[0].uri;
			if (side === "front") {
				setCacrFrontUriState(localUri);
			} else {
				setCacrBackUriState(localUri);
			}

			const storedKey = await uploadCapturedDocument({
				presign: presign.mutateAsync as never,
				localUri,
				fileName: `cacr-${side}.jpg`,
				purpose: side === "front" ? "driver-cacr-front" : "driver-cacr-back",
			});
			if (!storedKey) {
				Alert.alert(
					t("selfieUploadFailed"),
					t("selfieUploadFailedMsg"),
				);
				return;
			}
			if (side === "front") {
				setCacrFrontKey(storedKey);
				updateData({
					cacrFrontUri: storedKey,
					cacrFrontLocalPreview: localUri,
				});
			} else {
				setCacrBackKey(storedKey);
				updateData({
					cacrBackUri: storedKey,
					cacrBackLocalPreview: localUri,
				});
			}
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

		if (requiresCacr) {
			if (!cacrNumberInput.trim()) {
				Alert.alert(t("fieldRequired"), t("cacrNumberRequired", "Le numéro de CACR est obligatoire pour votre catégorie de permis."));
				return;
			}
			if (!cacrExpiryInput.trim()) {
				Alert.alert(t("fieldRequired"), t("cacrExpiryRequired", "La date d'expiration du CACR est obligatoire."));
				return;
			}

			const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
			if (!dateRegex.test(cacrExpiryInput.trim())) {
				Alert.alert(t("invalidDateFormat"), t("invalidDateFormatMsg"));
				return;
			}

			const parsedDate = new Date(cacrExpiryInput.trim());
			if (isNaN(parsedDate.getTime()) || parsedDate.getTime() < Date.now()) {
				Alert.alert(t("licenseExpired", "Document expiré"), t("cacrExpiredMsg", "La date d'expiration du CACR doit être valide et future."));
				return;
			}

			if ((cacrFrontUriState && !cacrFrontKey) || (cacrBackUriState && !cacrBackKey) || (!cacrFrontKey && !cacrFrontUriState) || (!cacrBackKey && !cacrBackUriState)) {
				Alert.alert(
					t("photosNotUploaded", "Photos manquantes"),
					t("cacrPhotosRequiredMsg", "Veuillez photographier le recto et le verso de votre CACR.")
				);
				return;
			}
		}

		DriverFeedback.tap();
		const stepData = {
			nationalIdNumber: idInput.trim(),
			medicalDocUri: medicalKey || medicalDocUri,
			cacrNumber: requiresCacr ? cacrNumberInput.trim() : undefined,
			cacrExpiryDate: requiresCacr ? cacrExpiryInput.trim() : undefined,
			cacrFrontUrl: requiresCacr ? (cacrFrontKey || cacrFrontUri) : undefined,
			cacrBackUrl: requiresCacr ? (cacrBackKey || cacrBackUri) : undefined,
		};

		updateData({
			...stepData,
			medicalDocLocalPreview: medicalUri || medicalDocLocalPreview,
			cacrFrontLocalPreview: cacrFrontUriState || cacrFrontLocalPreview,
			cacrBackLocalPreview: cacrBackUriState || cacrBackLocalPreview,
			currentStep: 4,
		});

		saveStep.mutate({
			step: "DOCUMENTS",
			stepData,
			nextStep: "CARRIER",
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

				{/* CACR Section (Required for C, D, E categories) */}
				{requiresCacr && (
					<Card className="p-5 gap-3">
						<View className="flex-row items-center justify-between">
							<Text className="text-base font-extrabold text-foreground tracking-tight">
								{t("cacrTitle", "Certificat d'Aptitude (CACR)")}
							</Text>
							<View className="bg-primary/15 px-2.5 py-1 rounded-full">
								<Text className="text-xs font-bold text-primary uppercase">
									{t("cacrRequiredBadge", "Obligatoire (C/D/E)")}
								</Text>
							</View>
						</View>
						<Text className="text-xs text-muted-foreground leading-5">
							{t("cacrSubtitle", "Conformément à la réglementation des transports routiers interurbains et poids lourds, le CACR est obligatoire.")}
						</Text>

						<View className="gap-4 pt-1">
							<Input
								label={t("cacrNumberLabel", "Numéro de CACR")}
								placeholder={t("cacrNumberPlaceholder", "Ex: CACR-2024-XXXXX")}
								value={cacrNumberInput}
								onChangeText={setCacrNumberInput}
								leftIcon={<HugeiconsIcon icon={CreditCardIcon} size={18} color={colors.neutral.textMuted} />}
							/>

							<Input
								label={t("cacrExpiryLabel", "Date d'expiration du CACR")}
								placeholder={t("licenseExpiryPlaceholder", "AAAA-MM-JJ")}
								value={cacrExpiryInput}
								onChangeText={setCacrExpiryInput}
								leftIcon={<HugeiconsIcon icon={Calendar01Icon} size={18} color={colors.neutral.textMuted} />}
							/>
						</View>

						<Text className="text-xs font-semibold text-muted-foreground pt-1">
							{t("cacrPhotosTitle", "Photos du certificat (Recto & Verso)")}
						</Text>

						<View className="flex-row gap-3">
							{/* CACR Recto */}
							<View className="flex-1 gap-1.5">
								<Text className="text-xs font-semibold text-muted-foreground">{t("photoFront", "Recto")}</Text>
								{cacrFrontUriState || cacrFrontKey ? (
									<Pressable
										onPress={() => handleCaptureCacr("front")}
										className="relative h-24 rounded-2xl overflow-hidden border border-border"
									>
										{cacrFrontUriState ? (
											<Image source={{ uri: cacrFrontUriState }} className="w-full h-full" />
										) : (
											<View className="w-full h-full bg-card items-center justify-center gap-1">
												<HugeiconsIcon icon={CheckmarkCircle02Icon} size={24} color={colors.semantic.success} />
												<Text className="text-xs font-bold text-success">{t("photoFrontUploaded", "Recto enregistré")}</Text>
											</View>
										)}
										<View className="absolute top-1.5 right-1.5 bg-card rounded-full p-1">
											<HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} color={colors.semantic.success} />
										</View>
									</Pressable>
								) : (
									<Pressable
										onPress={() => handleCaptureCacr("front")}
										className="h-24 border-1.5 border-dashed border-border rounded-2xl items-center justify-center bg-background gap-1.5"
									>
										<HugeiconsIcon icon={Camera01Icon} size={22} color={colors.primary.rose} />
										<Text className="text-xs font-bold text-foreground">{t("takeFront", "Photo Recto")}</Text>
									</Pressable>
								)}
							</View>

							{/* CACR Verso */}
							<View className="flex-1 gap-1.5">
								<Text className="text-xs font-semibold text-muted-foreground">{t("photoBack", "Verso")}</Text>
								{cacrBackUriState || cacrBackKey ? (
									<Pressable
										onPress={() => handleCaptureCacr("back")}
										className="relative h-24 rounded-2xl overflow-hidden border border-border"
									>
										{cacrBackUriState ? (
											<Image source={{ uri: cacrBackUriState }} className="w-full h-full" />
										) : (
											<View className="w-full h-full bg-card items-center justify-center gap-1">
												<HugeiconsIcon icon={CheckmarkCircle02Icon} size={24} color={colors.semantic.success} />
												<Text className="text-xs font-bold text-success">{t("photoBackUploaded", "Verso enregistré")}</Text>
											</View>
										)}
										<View className="absolute top-1.5 right-1.5 bg-card rounded-full p-1">
											<HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} color={colors.semantic.success} />
										</View>
									</Pressable>
								) : (
									<Pressable
										onPress={() => handleCaptureCacr("back")}
										className="h-24 border-1.5 border-dashed border-border rounded-2xl items-center justify-center bg-background gap-1.5"
									>
										<HugeiconsIcon icon={Camera01Icon} size={22} color={colors.primary.rose} />
										<Text className="text-xs font-bold text-foreground">{t("takeBack", "Photo Verso")}</Text>
									</Pressable>
								)}
							</View>
						</View>
					</Card>
				)}

				<Card className="p-5 gap-3">
					<View className="flex-row items-center justify-between">
						<Text className="text-base font-extrabold text-foreground tracking-tight">{t("medicalTitle")}</Text>
						<View className="bg-primary/15 px-2.5 py-1 rounded-full">
							<Text className="text-xs font-bold text-primary uppercase">{t("medicalOptionalBadge")}</Text>
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
