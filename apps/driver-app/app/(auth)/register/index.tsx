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
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { ScreenShell } from "@/components/ui/ScreenShell";

export default function RegisterStep1Screen() {
	const router = useRouter();
	const { data: session } = authClient.useSession();
	const trpc = useTRPC();
	const presign = useMutation(trpc.storage.presignUpload.mutationOptions());

	const {
		fullName,
		phone,
		yearsOfExperience,
		profileSelfieUri,
		updateData,
	} = useDriverRegistrationStore();

	const [nameInput, setNameInput] = useState(
		fullName || (session?.user as any)?.fullName || (session?.user as any)?.name || ""
	);
	const [phoneInput, setPhoneInput] = useState(
		phone || (session?.user as any)?.phoneNumber || ""
	);
	const [expInput, setExpInput] = useState(String(yearsOfExperience || 3));
	const [selfieUri, setSelfieUri] = useState<string | null>(profileSelfieUri);
	const [selfieKey, setSelfieKey] = useState<string | null>(
		profileSelfieUri?.startsWith("documents/") ? profileSelfieUri : null
	);

	const handleTakeSelfie = async () => {
		DriverFeedback.tap();
		const { status } = await ImagePicker.requestCameraPermissionsAsync();
		if (status !== "granted") {
			Alert.alert("Permission requise", "L'accès à la caméra est nécessaire pour la photo d'identité.");
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
					"Échec de téléversement",
					"Vérifiez votre connexion et reprenez la photo avant de continuer.",
				);
				return;
			}
			setSelfieKey(storedKey);
			updateData({ profileSelfieUri: storedKey });
		}
	};

	const handleNext = () => {
		if (!nameInput.trim()) {
			Alert.alert("Champ obligatoire", "Veuillez entrer votre nom complet.");
			return;
		}
		if (!phoneInput.trim()) {
			Alert.alert("Champ obligatoire", "Veuillez entrer votre numéro de téléphone.");
			return;
		}
		if (selfieUri && !selfieKey) {
			Alert.alert(
				"Photo non téléversée",
				"Votre photo d'identité n'a pas pu être envoyée. Reprenez la photo avant de continuer.",
			);
			return;
		}

		DriverFeedback.tap();
		updateData({
			fullName: nameInput.trim(),
			phone: phoneInput.trim(),
			yearsOfExperience: parseInt(expInput, 10) || 1,
			profileSelfieUri: selfieKey || profileSelfieUri,
		});

		router.push("/(auth)/register/license");
	};

	return (
		<ScreenShell
			header={
				<View>
					<PageHeader
						title="Inscription Chauffeur"
						subtitle="Étape 1 sur 4 : Identité personnelle"
						showBack
					/>
					{/* Progress Indicator */}
					<View style={styles.progressTrack}>
						<View style={[styles.progressBar, { width: "25%" }]} />
					</View>
				</View>
			}
			footer={
				<Button
					title="Continuer vers le permis"
					variant="primary"
					size="lg"
					onPress={handleNext}
					icon={<HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#ffffff" />}
					iconPosition="right"
				/>
			}
		>
			<View style={styles.formCard}>
				<Text style={styles.sectionTitle}>Photo d'identité professionnelle</Text>
				<Text style={styles.sectionSubtitle}>
					Une photo nette de votre visage pour votre badge de chauffeur et le manifeste passagers.
				</Text>

				<View style={styles.selfieContainer}>
					{selfieUri ? (
						<View style={styles.selfieWrapper}>
							<Image source={{ uri: selfieUri }} style={styles.selfieImage} />
							<TouchableOpacity
								onPress={handleTakeSelfie}
								activeOpacity={0.8}
								style={styles.retakeButton}
							>
								<HugeiconsIcon icon={Camera01Icon} size={16} color="#fafafa" />
								<Text style={styles.retakeText}>Reprendre</Text>
							</TouchableOpacity>
						</View>
					) : (
						<TouchableOpacity
							onPress={handleTakeSelfie}
							activeOpacity={0.8}
							style={styles.captureBox}
						>
							<View style={styles.cameraIconWrap}>
								<HugeiconsIcon icon={Camera01Icon} size={28} color="#ee237c" />
							</View>
							<Text style={styles.captureText}>Prendre un selfie</Text>
							<Text style={styles.captureHint}>Format carré, bien éclairé</Text>
						</TouchableOpacity>
					)}
				</View>
			</View>

			<View style={styles.formCard}>
				<Text style={styles.sectionTitle}>Informations personnelles</Text>

				<View style={styles.inputsList}>
					<Input
						label="Nom complet officiel"
						placeholder="ex: Ibrahim Touré"
						value={nameInput}
						onChangeText={setNameInput}
						leftIcon={<HugeiconsIcon icon={User02Icon} size={18} color="#71717a" />}
					/>

					<Input
						label="Numéro de téléphone (Vérifié)"
						placeholder="ex: +225 07 00 00 00 00"
						keyboardType="phone-pad"
						value={phoneInput}
						editable={false}
						onChangeText={setPhoneInput}
						leftIcon={<HugeiconsIcon icon={Call02Icon} size={18} color="#71717a" />}
					/>

					<Input
						label="Années d'expérience de conduite"
						placeholder="ex: 5"
						keyboardType="number-pad"
						value={expInput}
						onChangeText={setExpInput}
						leftIcon={<HugeiconsIcon icon={Award01Icon} size={18} color="#71717a" />}
					/>
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
	selfieContainer: {
		alignItems: "center",
		paddingVertical: 8,
	},
	selfieWrapper: {
		alignItems: "center",
		gap: 10,
	},
	selfieImage: {
		width: 120,
		height: 120,
		borderRadius: 60,
		borderWidth: 3,
		borderColor: "#ee237c",
	},
	retakeButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: 999,
		backgroundColor: "#27272a",
	},
	retakeText: {
		fontSize: 11,
		fontWeight: "700",
		color: "#fafafa",
	},
	captureBox: {
		width: "100%",
		height: 140,
		borderWidth: 2,
		borderStyle: "dashed",
		borderColor: "#3f3f46",
		borderRadius: 18,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(24, 24, 27, 0.5)",
		gap: 6,
	},
	cameraIconWrap: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: "rgba(238, 35, 124, 0.12)",
		alignItems: "center",
		justifyContent: "center",
	},
	captureText: {
		fontSize: 13,
		fontWeight: "700",
		color: "#fafafa",
	},
	captureHint: {
		fontSize: 11,
		color: "#71717a",
	},
	inputsList: {
		gap: 16,
		paddingTop: 4,
	},
});
