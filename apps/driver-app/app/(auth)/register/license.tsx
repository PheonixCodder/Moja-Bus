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
	CreditCardIcon,
	Calendar01Icon,
	Camera01Icon,
	CheckmarkCircle02Icon,
	ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { useDriverRegistrationStore, type LicenseCategoryType } from "@/stores/driver-registration";
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

const LICENSE_CATEGORY_KEYS: Array<{
	category: LicenseCategoryType;
	titleKey: string;
	descKey: string;
}> = [
	{ category: "D", titleKey: "licenseCatD", descKey: "licenseCatDDesc" },
	{ category: "E", titleKey: "licenseCatE", descKey: "licenseCatEDesc" },
	{ category: "C", titleKey: "licenseCatC", descKey: "licenseCatCDesc" },
	{ category: "B", titleKey: "licenseCatB", descKey: "licenseCatBDesc" },
];

export default function RegisterStep2LicenseScreen() {
	const { t } = useTranslation("auth");
	const router = useRouter();
	useWizardGuard(2);

	const {
		licenseNumber,
		licenseCategory,
		licenseExpiryDate,
		licenseFrontUri,
		licenseFrontLocalPreview,
		licenseBackUri,
		licenseBackLocalPreview,
		updateData,
	} = useDriverRegistrationStore();

	useEffect(() => {
		updateData({ currentStep: 2 });
	}, [updateData]);

	const [numberInput, setNumberInput] = useState(licenseNumber);
	const [categorySelect, setCategorySelect] = useState<LicenseCategoryType>(licenseCategory || "D");
	const [expiryInput, setExpiryInput] = useState(licenseExpiryDate);
	const [frontUri, setFrontUri] = useState<string | null>(
		licenseFrontLocalPreview || (licenseFrontUri && !licenseFrontUri.startsWith("documents/") ? licenseFrontUri : null)
	);
	const [backUri, setBackUri] = useState<string | null>(
		licenseBackLocalPreview || (licenseBackUri && !licenseBackUri.startsWith("documents/") ? licenseBackUri : null)
	);
	const [frontKey, setFrontKey] = useState<string | null>(
		licenseFrontUri?.startsWith("documents/") ? licenseFrontUri : null,
	);
	const [backKey, setBackKey] = useState<string | null>(
		licenseBackUri?.startsWith("documents/") ? licenseBackUri : null,
	);
	const trpc = useTRPC();
	const presign = useMutation(trpc.storage.presignUpload.mutationOptions());

	const handleCaptureDocument = async (type: "front" | "back") => {
		DriverFeedback.tap();
		const { status } = await ImagePicker.requestCameraPermissionsAsync();
		if (status !== "granted") {
			Alert.alert(t("cameraPermission"), t("licenseCameraMsg"));
			return;
		}

		const result = await ImagePicker.launchCameraAsync({
			allowsEditing: true,
			aspect: [16, 10],
			quality: 0.7,
		});

		if (!result.canceled && result.assets?.[0]?.uri) {
			const localUri = result.assets[0].uri;
			if (type === "front") setFrontUri(localUri);
			else setBackUri(localUri);

			const storedKey = await uploadCapturedDocument({
				presign: presign.mutateAsync as never,
				localUri,
				fileName: `license-${type}.jpg`,
				purpose: type === "front" ? "driver-license-front" : "driver-license-back",
			});
			if (!storedKey) {
				Alert.alert(
					t("selfieUploadFailed"),
					t("selfieUploadFailedMsg"),
				);
				return;
			}
			if (type === "front") {
				setFrontKey(storedKey);
				updateData({
					licenseFrontUri: storedKey,
					licenseFrontLocalPreview: localUri,
				});
			} else {
				setBackKey(storedKey);
				updateData({
					licenseBackUri: storedKey,
					licenseBackLocalPreview: localUri,
				});
			}
		}
	};

	const handleNext = () => {
		if (!numberInput.trim()) {
			Alert.alert(t("fieldRequired"), t("licenseNumberRequired"));
			return;
		}
		if (!expiryInput.trim()) {
			Alert.alert(t("fieldRequired"), t("licenseExpiryRequired"));
			return;
		}

		const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
		if (!dateRegex.test(expiryInput.trim())) {
			Alert.alert(
				t("invalidDateFormat"),
				t("invalidDateFormatMsg")
			);
			return;
		}

		const parsedDate = new Date(expiryInput.trim());
		if (isNaN(parsedDate.getTime()) || parsedDate.getTime() < Date.now()) {
			Alert.alert(
				t("licenseExpired"),
				t("licenseExpiredMsg")
			);
			return;
		}

		if ((frontUri && !frontKey) || (backUri && !backKey)) {
			Alert.alert(
				t("photosNotUploaded"),
				t("photosNotUploadedMsg")
			);
			return;
		}

		DriverFeedback.tap();
		updateData({
			licenseNumber: numberInput.trim(),
			licenseCategory: categorySelect,
			licenseExpiryDate: expiryInput.trim(),
			licenseFrontUri: frontKey || licenseFrontUri,
			licenseFrontLocalPreview: frontUri || licenseFrontLocalPreview,
			licenseBackUri: backKey || licenseBackUri,
			licenseBackLocalPreview: backUri || licenseBackLocalPreview,
			currentStep: 3,
		});

		router.push("/(auth)/register/documents");
	};

	return (
		<ScreenShell
			header={
				<View>
					<PageHeader
						title={t("step2Title")}
						subtitle={t("step2Subtitle")}
						showBack
						onBack={() => router.replace("/(auth)/register")}
					/>
					<View className="h-1 bg-card w-full">
						<View className="h-full bg-primary w-1/2" />
					</View>
				</View>
			}
			footer={
				<Button
					title={t("continueToDocuments")}
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
					<Text className="text-base font-extrabold text-foreground tracking-tight">{t("licenseCategoryTitle")}</Text>
					<Text className="text-xs text-muted-foreground leading-5">
						{t("licenseCategorySubtitle")}
					</Text>

					<View className="gap-2.5 pt-1">
						{LICENSE_CATEGORY_KEYS.map((item) => {
							const isSelected = categorySelect === item.category;
							return (
								<Pressable
									key={item.category}
									onPress={() => {
										DriverFeedback.tap();
										setCategorySelect(item.category);
									}}
									className={`p-3.5 rounded-2xl border-1.5 gap-1.5 ${
										isSelected
											? "border-primary bg-primary/10"
											: "border-border bg-background"
									}`}
								>
									<View className="flex-row items-center justify-between">
										<View className="flex-row items-center gap-2.5">
											<View
												className={`w-8 h-8 rounded-xl items-center justify-center ${
													isSelected ? "bg-primary" : "bg-border"
												}`}
											>
												<Text
													className={`text-sm font-extrabold ${
														isSelected ? "text-primary-foreground" : "text-muted-foreground"
													}`}
												>
													{item.category}
												</Text>
											</View>
											<Text className="text-sm font-bold text-foreground">{t(item.titleKey)}</Text>
										</View>
										{isSelected ? (
											<HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} color={colors.primary.rose} />
										) : null}
									</View>
									<Text className="text-xs text-muted-foreground pl-10 leading-4">{t(item.descKey)}</Text>
								</Pressable>
							);
						})}
					</View>
				</Card>

				<Card className="p-5 gap-3">
					<Text className="text-base font-extrabold text-foreground tracking-tight">{t("licenseNumberLabel")}</Text>

					<View className="gap-4 pt-1">
						<Input
							label={t("licenseNumberLabel")}
							placeholder={t("licenseNumberPlaceholder")}
							value={numberInput}
							onChangeText={setNumberInput}
							leftIcon={<HugeiconsIcon icon={CreditCardIcon} size={18} color={colors.neutral.textMuted} />}
						/>

						<Input
							label={t("licenseExpiryLabel")}
							placeholder={t("licenseExpiryPlaceholder")}
							value={expiryInput}
							onChangeText={setExpiryInput}
							leftIcon={<HugeiconsIcon icon={Calendar01Icon} size={18} color={colors.neutral.textMuted} />}
						/>
					</View>
				</Card>

				<Card className="p-5 gap-3">
					<Text className="text-base font-extrabold text-foreground tracking-tight">{t("licensePhotosTitle")}</Text>
					<Text className="text-xs text-muted-foreground leading-5">
						{t("licensePhotosSubtitle")}
					</Text>

					<View className="flex-row gap-3 pt-1.5">
						{/* Recto */}
						<View className="flex-1 gap-1.5">
							<Text className="text-xs font-semibold text-muted-foreground">{t("photoFront")}</Text>
							{frontUri || frontKey ? (
								<Pressable
									onPress={() => handleCaptureDocument("front")}
									className="relative h-24 rounded-2xl overflow-hidden border border-border"
								>
									{frontUri ? (
										<Image source={{ uri: frontUri }} className="w-full h-full" />
									) : (
										<View className="w-full h-full bg-card items-center justify-center gap-1">
											<HugeiconsIcon icon={CheckmarkCircle02Icon} size={24} color={colors.semantic.success} />
											<Text className="text-[10px] font-bold text-success">{t("photoFrontUploaded", "Recto enregistré")}</Text>
										</View>
									)}
									<View className="absolute top-1.5 right-1.5 bg-card rounded-full p-1">
										<HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} color={colors.semantic.success} />
									</View>
								</Pressable>
							) : (
								<Pressable
									onPress={() => handleCaptureDocument("front")}
									className="h-24 border-1.5 border-dashed border-border rounded-2xl items-center justify-center bg-background gap-1.5"
								>
									<HugeiconsIcon icon={Camera01Icon} size={22} color={colors.primary.rose} />
									<Text className="text-xs font-bold text-foreground">{t("takeFront")}</Text>
								</Pressable>
							)}
						</View>

						{/* Verso */}
						<View className="flex-1 gap-1.5">
							<Text className="text-xs font-semibold text-muted-foreground">{t("photoBack")}</Text>
							{backUri || backKey ? (
								<Pressable
									onPress={() => handleCaptureDocument("back")}
									className="relative h-24 rounded-2xl overflow-hidden border border-border"
								>
									{backUri ? (
										<Image source={{ uri: backUri }} className="w-full h-full" />
									) : (
										<View className="w-full h-full bg-card items-center justify-center gap-1">
											<HugeiconsIcon icon={CheckmarkCircle02Icon} size={24} color={colors.semantic.success} />
											<Text className="text-[10px] font-bold text-success">{t("photoBackUploaded", "Verso enregistré")}</Text>
										</View>
									)}
									<View className="absolute top-1.5 right-1.5 bg-card rounded-full p-1">
										<HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} color={colors.semantic.success} />
									</View>
								</Pressable>
							) : (
								<Pressable
									onPress={() => handleCaptureDocument("back")}
									className="h-24 border-1.5 border-dashed border-border rounded-2xl items-center justify-center bg-background gap-1.5"
								>
									<HugeiconsIcon icon={Camera01Icon} size={22} color={colors.primary.rose} />
									<Text className="text-xs font-bold text-foreground">{t("takeBack")}</Text>
								</Pressable>
							)}
						</View>
					</View>
				</Card>
			</View>
		</ScreenShell>
	);
}
