import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
	View,
	Text,
	Image,
	Alert,
	TouchableOpacity,
	StyleSheet,
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
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { ScreenShell } from "@/components/ui/ScreenShell";

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
						onBack={() => router.canGoBack() ? router.back() : router.replace("/(auth)/register")}
					/>
					<View style={styles.progressTrack}>
						<View style={[styles.progressBar, { width: "50%" }]} />
					</View>
				</View>
			}
			footer={
				<Button
					title={t("continueToDocuments")}
					variant="primary"
					size="lg"
					onPress={handleNext}
					icon={<HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#ffffff" />}
					iconPosition="right"
				/>
			}
		>
			<View style={styles.formCard}>
				<Text style={styles.sectionTitle}>{t("licenseCategoryTitle")}</Text>
				<Text style={styles.sectionSubtitle}>
					{t("licenseCategorySubtitle")}
				</Text>

				<View style={styles.categoriesList}>
					{LICENSE_CATEGORY_KEYS.map((item) => {
						const isSelected = categorySelect === item.category;
						return (
							<TouchableOpacity
								key={item.category}
								onPress={() => {
									DriverFeedback.tap();
									setCategorySelect(item.category);
								}}
								activeOpacity={0.8}
								style={[
									styles.categoryCard,
									isSelected && styles.categoryCardSelected,
								]}
							>
								<View style={styles.categoryHeader}>
									<View style={styles.categoryLeft}>
										<View
											style={[
												styles.categoryBadge,
												isSelected && styles.categoryBadgeSelected,
											]}
										>
											<Text
												style={[
													styles.categoryBadgeText,
													isSelected && styles.categoryBadgeTextSelected,
												]}
											>
												{item.category}
											</Text>
										</View>
										<Text style={styles.categoryTitle}>{t(item.titleKey)}</Text>
									</View>
									{isSelected ? (
										<HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} color="#ee237c" />
									) : null}
								</View>
								<Text style={styles.categoryDesc}>{t(item.descKey)}</Text>
							</TouchableOpacity>
						);
					})}
				</View>
			</View>

			<View style={styles.formCard}>
				<Text style={styles.sectionTitle}>{t("licenseNumberLabel")}</Text>

				<View style={styles.inputsList}>
					<Input
						label={t("licenseNumberLabel")}
						placeholder={t("licenseNumberPlaceholder")}
						value={numberInput}
						onChangeText={setNumberInput}
						leftIcon={<HugeiconsIcon icon={CreditCardIcon} size={18} color="#71717a" />}
					/>

					<Input
						label={t("licenseExpiryLabel")}
						placeholder={t("licenseExpiryPlaceholder")}
						value={expiryInput}
						onChangeText={setExpiryInput}
						leftIcon={<HugeiconsIcon icon={Calendar01Icon} size={18} color="#71717a" />}
					/>
				</View>
			</View>

			<View style={styles.formCard}>
				<Text style={styles.sectionTitle}>{t("licensePhotosTitle")}</Text>
				<Text style={styles.sectionSubtitle}>
					{t("licensePhotosSubtitle")}
				</Text>

				<View style={styles.photosRow}>
					{/* Recto */}
					<View style={styles.photoCol}>
						<Text style={styles.photoLabel}>{t("photoFront")}</Text>
						{frontUri || frontKey ? (
							<TouchableOpacity
								onPress={() => handleCaptureDocument("front")}
								style={styles.photoPreviewWrap}
							>
								{frontUri ? (
									<Image source={{ uri: frontUri }} style={styles.photoPreview} />
								) : (
									<View style={[styles.photoPreview, styles.uploadedBox]}>
										<HugeiconsIcon icon={CheckmarkCircle02Icon} size={24} color="#10b981" />
										<Text style={styles.uploadedText}>{t("photoFrontUploaded", "Recto enregistré")}</Text>
									</View>
								)}
								<View style={styles.photoSuccessBadge}>
									<HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} color="#10b981" />
								</View>
							</TouchableOpacity>
						) : (
							<TouchableOpacity
								onPress={() => handleCaptureDocument("front")}
								style={styles.photoCaptureBox}
							>
								<HugeiconsIcon icon={Camera01Icon} size={22} color="#ee237c" />
								<Text style={styles.photoCaptureText}>{t("takeFront")}</Text>
							</TouchableOpacity>
						)}
					</View>

					{/* Verso */}
					<View style={styles.photoCol}>
						<Text style={styles.photoLabel}>{t("photoBack")}</Text>
						{backUri || backKey ? (
							<TouchableOpacity
								onPress={() => handleCaptureDocument("back")}
								style={styles.photoPreviewWrap}
							>
								{backUri ? (
									<Image source={{ uri: backUri }} style={styles.photoPreview} />
								) : (
									<View style={[styles.photoPreview, styles.uploadedBox]}>
										<HugeiconsIcon icon={CheckmarkCircle02Icon} size={24} color="#10b981" />
										<Text style={styles.uploadedText}>{t("photoBackUploaded", "Verso enregistré")}</Text>
									</View>
								)}
								<View style={styles.photoSuccessBadge}>
									<HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} color="#10b981" />
								</View>
							</TouchableOpacity>
						) : (
							<TouchableOpacity
								onPress={() => handleCaptureDocument("back")}
								style={styles.photoCaptureBox}
							>
								<HugeiconsIcon icon={Camera01Icon} size={22} color="#ee237c" />
								<Text style={styles.photoCaptureText}>{t("takeBack")}</Text>
							</TouchableOpacity>
						)}
					</View>
				</View>
			</View>
		</ScreenShell>
	);
}

const styles = StyleSheet.create({
	progressTrack: {
		height: 4,
		backgroundColor: "#18181b",
		width: "100%",
	},
	progressBar: {
		height: "100%",
		backgroundColor: "#ee237c",
		borderTopRightRadius: 4,
		borderBottomRightRadius: 4,
	},
	formCard: {
		backgroundColor: "#18181b",
		borderWidth: 1,
		borderColor: "#27272a",
		borderRadius: 20,
		padding: 20,
		gap: 12,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: "800",
		color: "#fafafa",
		letterSpacing: -0.2,
	},
	sectionSubtitle: {
		fontSize: 12,
		color: "#a1a1aa",
		lineHeight: 18,
	},
	categoriesList: {
		gap: 10,
		paddingTop: 4,
	},
	categoryCard: {
		padding: 14,
		borderRadius: 16,
		borderWidth: 1.5,
		borderColor: "#27272a",
		backgroundColor: "#09090b",
		gap: 6,
	},
	categoryCardSelected: {
		borderColor: "#ee237c",
		backgroundColor: "rgba(238, 35, 124, 0.06)",
	},
	categoryHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	categoryLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	categoryBadge: {
		width: 32,
		height: 32,
		borderRadius: 10,
		backgroundColor: "#27272a",
		alignItems: "center",
		justifyContent: "center",
	},
	categoryBadgeSelected: {
		backgroundColor: "#ee237c",
	},
	categoryBadgeText: {
		fontSize: 14,
		fontWeight: "800",
		color: "#a1a1aa",
	},
	categoryBadgeTextSelected: {
		color: "#ffffff",
	},
	categoryTitle: {
		fontSize: 14,
		fontWeight: "700",
		color: "#fafafa",
	},
	categoryDesc: {
		fontSize: 11,
		color: "#71717a",
		paddingLeft: 42,
	},
	inputsList: {
		gap: 16,
		paddingTop: 4,
	},
	photosRow: {
		flexDirection: "row",
		gap: 12,
		paddingTop: 6,
	},
	photoCol: {
		flex: 1,
		gap: 6,
	},
	photoLabel: {
		fontSize: 12,
		fontWeight: "600",
		color: "#d4d4d8",
	},
	photoCaptureBox: {
		height: 100,
		borderWidth: 1.5,
		borderStyle: "dashed",
		borderColor: "#3f3f46",
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#09090b",
		gap: 6,
	},
	photoCaptureText: {
		fontSize: 11,
		fontWeight: "700",
		color: "#fafafa",
	},
	photoPreviewWrap: {
		position: "relative",
		height: 100,
		borderRadius: 14,
		overflow: "hidden",
		borderWidth: 1,
		borderColor: "#27272a",
	},
	photoPreview: {
		width: "100%",
		height: "100%",
	},
	uploadedBox: {
		backgroundColor: "#18181b",
		alignItems: "center",
		justifyContent: "center",
		gap: 4,
	},
	uploadedText: {
		fontSize: 10,
		fontWeight: "700",
		color: "#10b981",
	},
	photoSuccessBadge: {
		position: "absolute",
		top: 6,
		right: 6,
		backgroundColor: "#18181b",
		borderRadius: 999,
		padding: 3,
	},
});
