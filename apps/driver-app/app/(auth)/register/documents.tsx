import { useState } from "react";
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
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { ScreenShell } from "@/components/ui/ScreenShell";

export default function RegisterStep3DocumentsScreen() {
	const router = useRouter();
	useWizardGuard(3);

	const {
		nationalIdNumber,
		medicalDocUri,
		updateData,
	} = useDriverRegistrationStore();
	const trpc = useTRPC();
	const presign = useMutation(trpc.storage.presignUpload.mutationOptions());

	const [idInput, setIdInput] = useState(nationalIdNumber);
	const [medicalUri, setMedicalUri] = useState<string | null>(medicalDocUri);
	const [medicalKey, setMedicalKey] = useState<string | null>(
		medicalDocUri?.startsWith("documents/") ? medicalDocUri : null,
	);

	const handleCaptureMedical = async () => {
		DriverFeedback.tap();
		const { status } = await ImagePicker.requestCameraPermissionsAsync();
		if (status !== "granted") {
			Alert.alert("Permission requise", "L'accès à la caméra est requis pour photographier votre certificat médical.");
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
					"Échec de téléversement",
					"Vérifiez votre connexion et reprenez la photo avant de continuer.",
				);
				return;
			}
			setMedicalKey(storedKey);
			updateData({ medicalDocUri: storedKey });
		}
	};

	const handleNext = () => {
		if (!idInput.trim()) {
			Alert.alert("Champ obligatoire", "Veuillez saisir votre numéro national d'identité (CNI).");
			return;
		}
		if (medicalUri && !medicalKey) {
			Alert.alert(
				"Document non téléversé",
				"Votre certificat médical n'a pas pu être envoyé. Reprenez-le ou supprimez-le avant de continuer.",
			);
			return;
		}

		DriverFeedback.tap();
		updateData({
			nationalIdNumber: idInput.trim(),
		});

		router.push("/(auth)/register/carrier");
	};

	return (
		<ScreenShell
			header={
				<View>
					<PageHeader
						title="Documents Légaux"
						subtitle="Étape 3 sur 4 : CNI et certificat médical"
						showBack
					/>
					<View style={styles.progressTrack}>
						<View style={[styles.progressBar, { width: "75%" }]} />
					</View>
				</View>
			}
			footer={
				<Button
					title="Continuer vers l'affiliation"
					variant="primary"
					size="lg"
					onPress={handleNext}
					icon={<HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#ffffff" />}
					iconPosition="right"
				/>
			}
		>
			<View style={styles.formCard}>
				<Text style={styles.sectionTitle}>Carte Nationale d'Identité (CNI)</Text>
				<Text style={styles.sectionSubtitle}>
					Votre numéro officiel pour la vérification réglementaire en Côte d'Ivoire.
				</Text>

				<View style={styles.inputsList}>
					<Input
						label="Numéro CNI / Passeport"
						placeholder="ex: C0129849201"
						value={idInput}
						onChangeText={setIdInput}
						leftIcon={<HugeiconsIcon icon={IdentityCardIcon} size={18} color="#71717a" />}
					/>
				</View>
			</View>

			<View style={styles.formCard}>
				<View style={styles.cardHeaderRow}>
					<Text style={styles.sectionTitle}>Certificat d'Aptitude Médicale</Text>
					<View style={styles.optionalBadge}>
						<Text style={styles.optionalText}>Recommandé</Text>
					</View>
				</View>
				<Text style={styles.sectionSubtitle}>
					Exigé pour les trajets interurbains et autoroutiers longue distance.
				</Text>

				<View style={styles.uploadWrapper}>
					{medicalUri ? (
						<TouchableOpacity
							onPress={handleCaptureMedical}
							style={styles.previewBox}
						>
							<Image source={{ uri: medicalUri }} style={styles.previewImage} />
							<View style={styles.previewSuccessTag}>
								<HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} color="#10b981" />
								<Text style={styles.previewSuccessText}>Document téléversé</Text>
							</View>
						</TouchableOpacity>
					) : (
						<TouchableOpacity
							onPress={handleCaptureMedical}
							activeOpacity={0.8}
							style={styles.captureBox}
						>
							<View style={styles.cameraIconWrap}>
								<HugeiconsIcon icon={HealthIcon} size={26} color="#ee237c" />
							</View>
							<Text style={styles.captureTitle}>Scanner le certificat médical</Text>
							<Text style={styles.captureHint}>Document officiel datant de moins de 1 an</Text>
						</TouchableOpacity>
					)}
				</View>
			</View>

			<View style={styles.complianceCard}>
				<HugeiconsIcon icon={SecurityCheckIcon} size={20} color="#10b981" />
				<View style={styles.complianceTextWrap}>
					<Text style={styles.complianceTitle}>Confidentialité Garantie</Text>
					<Text style={styles.complianceDesc}>
						Vos pièces justificatives sont chiffrées de bout en bout et conservées conformément à la réglementation ARTCI.
					</Text>
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
	cardHeaderRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	optionalBadge: {
		backgroundColor: "rgba(59, 130, 246, 0.15)",
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 999,
	},
	optionalText: {
		fontSize: 10,
		fontWeight: "700",
		color: "#60a5fa",
		textTransform: "uppercase",
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
	inputsList: {
		paddingTop: 4,
	},
	uploadWrapper: {
		paddingTop: 4,
	},
	captureBox: {
		height: 120,
		borderWidth: 1.5,
		borderStyle: "dashed",
		borderColor: "#3f3f46",
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#09090b",
		gap: 6,
	},
	cameraIconWrap: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: "rgba(238, 35, 124, 0.12)",
		alignItems: "center",
		justifyContent: "center",
	},
	captureTitle: {
		fontSize: 13,
		fontWeight: "700",
		color: "#fafafa",
	},
	captureHint: {
		fontSize: 11,
		color: "#71717a",
	},
	previewBox: {
		position: "relative",
		height: 130,
		borderRadius: 16,
		overflow: "hidden",
		borderWidth: 1,
		borderColor: "#27272a",
	},
	previewImage: {
		width: "100%",
		height: "100%",
	},
	previewSuccessTag: {
		position: "absolute",
		bottom: 10,
		right: 10,
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		backgroundColor: "rgba(24, 24, 27, 0.9)",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 999,
		borderWidth: 1,
		borderColor: "#27272a",
	},
	previewSuccessText: {
		fontSize: 11,
		fontWeight: "700",
		color: "#fafafa",
	},
	complianceCard: {
		flexDirection: "row",
		gap: 12,
		backgroundColor: "rgba(16, 185, 129, 0.08)",
		borderWidth: 1,
		borderColor: "rgba(16, 185, 129, 0.2)",
		borderRadius: 16,
		padding: 16,
	},
	complianceTextWrap: {
		flex: 1,
		gap: 4,
	},
	complianceTitle: {
		fontSize: 13,
		fontWeight: "700",
		color: "#10b981",
	},
	complianceDesc: {
		fontSize: 11,
		color: "#a1a1aa",
		lineHeight: 16,
	},
});
