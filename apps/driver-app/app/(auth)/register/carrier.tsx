import { useState } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	Alert,
	StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
	Building01Icon,
	CheckmarkCircle02Icon,
	SentIcon,
} from "@hugeicons/core-free-icons";
import {
	useDriverRegistrationStore,
	type EmploymentType,
} from "@/stores/driver-registration";
import { useWizardGuard } from "@/hooks/use-wizard-guard";
import { useTRPC } from "@/lib/trpc";
import { DriverFeedback } from "@/lib/haptics";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { ScreenShell } from "@/components/ui/ScreenShell";

const EMPLOYMENT_TYPES: Array<{
	type: EmploymentType;
	title: string;
	desc: string;
	badge: string;
}> = [
	{
		type: "EXCLUSIVE_INTERCITY",
		title: "Chauffeur Interurbain Dédié",
		desc: "Affilié à une compagnie pour des liaisons régulières entre villes.",
		badge: "Recommandé",
	},
	{
		type: "CONTRACTOR_URBAN",
		title: "Chauffeur Urbain Contractuel",
		desc: "Navettes urbaines, lignes express locales et services scolaires/privés.",
		badge: "Urbain",
	},
	{
		type: "HYBRID",
		title: "Prestataire Hybride (Intercity & Urbain)",
		desc: "Disponible pour les deux types d'opérations et missions de relève.",
		badge: "Flexible",
	},
];

export default function RegisterStep4CarrierScreen() {
	const router = useRouter();
	useWizardGuard(4);

	const trpc = useTRPC();
	const store = useDriverRegistrationStore();

	const [code, setCode] = useState(store.carrierCode);
	const [employmentType, setEmploymentType] = useState<EmploymentType>(
		store.employmentType || "EXCLUSIVE_INTERCITY"
	);

	const registerMutation = useMutation(
		trpc.drivers.registerDriver.mutationOptions()
	);

	const handleSubmitRegistration = async () => {
		DriverFeedback.tap();

		try {
			const result = await registerMutation.mutateAsync({
				fullName: store.fullName,
				phone: store.phone,
				licenseNumber: store.licenseNumber,
				licenseCategory: store.licenseCategory,
				licenseExpiryDate: new Date(store.licenseExpiryDate),
				licenseFrontUrl: store.licenseFrontUri || undefined,
				licenseBackUrl: store.licenseBackUri || undefined,
				yearsOfExperience: store.yearsOfExperience,
				selfieUrl: store.profileSelfieUri || undefined,
				medicalDocUrl: store.medicalDocUri || undefined,
				nationalIdNumber: store.nationalIdNumber || undefined,
				employmentType,
				carrierInviteCode: code.trim() || undefined,
			});

			DriverFeedback.successScan();
			store.reset();

			if (!result.affiliated) {
				Alert.alert(
					"Aucun transporteur associé",
					code.trim()
						? "Votre code d'invitation ne correspond à aucun transporteur actif. Votre dossier a été soumis — une fois vérifié, les opérateurs pourront vous contacter sur la marketplace."
						: "Dossier soumis sans code transporteur. Une fois vérifié, vous serez visible par les opérateurs sur la marketplace.",
				);
			}
			router.replace("/(auth)/register/status");
		} catch (err: any) {
			DriverFeedback.invalidScan();
			if (err?.message?.startsWith("PHONE_REVERIFICATION_REQUIRED")) {
				const parts = err.message.split("::");
				Alert.alert(
					"Numéro de téléphone non concordant",
					`Votre compte utilise ${parts[1] ?? "un autre numéro"}, mais vous avez saisi ${
						parts[2] ?? "un numéro différent"
					}. Les codes de connexion sont envoyés à votre numéro de compte.`,
				);
			} else {
				Alert.alert(
					"Erreur d'inscription",
					err.message || "Échec de l'envoi de votre candidature.",
				);
			}
		}
	};

	return (
		<ScreenShell
			header={
				<View>
					<PageHeader
						title="Inscription Chauffeur"
						subtitle="Étape 4 sur 4 : Affiliation transporteur"
						showBack
					/>
					<View style={styles.progressTrack}>
						<View style={[styles.progressBar, { width: "100%" }]} />
					</View>
				</View>
			}
			footer={
				<Button
					title="Soumettre mon dossier officiel"
					variant="primary"
					size="lg"
					loading={registerMutation.isPending}
					onPress={handleSubmitRegistration}
					icon={<HugeiconsIcon icon={SentIcon} size={18} color="#ffffff" />}
					iconPosition="right"
				/>
			}
		>
			<View style={styles.formCard}>
				<Text style={styles.sectionTitle}>Mode de collaboration</Text>
				<Text style={styles.sectionSubtitle}>
					Définissez votre modalité d'exercice sur le réseau Moja.
				</Text>

				<View style={styles.typesList}>
					{EMPLOYMENT_TYPES.map((item) => {
						const isSelected = employmentType === item.type;
						return (
							<TouchableOpacity
								key={item.type}
								onPress={() => {
									DriverFeedback.tap();
									setEmploymentType(item.type);
								}}
								activeOpacity={0.8}
								style={[
									styles.typeCard,
									isSelected && styles.typeCardSelected,
								]}
							>
								<View style={styles.typeHeader}>
									<Text style={styles.typeTitle}>{item.title}</Text>
									<View style={styles.typeRight}>
										<View style={styles.typeBadge}>
											<Text style={styles.typeBadgeText}>{item.badge}</Text>
										</View>
										{isSelected ? (
											<HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} color="#ee237c" />
										) : null}
									</View>
								</View>
								<Text style={styles.typeDesc}>{item.desc}</Text>
							</TouchableOpacity>
						);
					})}
				</View>
			</View>

			<View style={styles.formCard}>
				<View style={styles.carrierHeaderRow}>
					<Text style={styles.sectionTitle}>Code d'invitation compagnie</Text>
					<View style={styles.optionalBadge}>
						<Text style={styles.optionalText}>Optionnel</Text>
					</View>
				</View>
				<Text style={styles.sectionSubtitle}>
					Si vous êtes déjà recruté par un transporteur partenaire, entrez le code fourni.
				</Text>

				<View style={styles.inputWrapper}>
					<Input
						label="Code Transporteur"
						placeholder="ex: UTB-CI-9901"
						value={code}
						onChangeText={setCode}
						autoCapitalize="characters"
						leftIcon={<HugeiconsIcon icon={Building01Icon} size={18} color="#71717a" />}
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
	},
	formCard: {
		backgroundColor: "#18181b",
		borderWidth: 1,
		borderColor: "#27272a",
		borderRadius: 20,
		padding: 20,
		gap: 12,
	},
	carrierHeaderRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	optionalBadge: {
		backgroundColor: "rgba(113, 113, 122, 0.2)",
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 999,
	},
	optionalText: {
		fontSize: 10,
		fontWeight: "700",
		color: "#a1a1aa",
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
	typesList: {
		gap: 10,
		paddingTop: 4,
	},
	typeCard: {
		padding: 14,
		borderRadius: 16,
		borderWidth: 1.5,
		borderColor: "#27272a",
		backgroundColor: "#09090b",
		gap: 6,
	},
	typeCardSelected: {
		borderColor: "#ee237c",
		backgroundColor: "rgba(238, 35, 124, 0.06)",
	},
	typeHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	typeTitle: {
		fontSize: 14,
		fontWeight: "700",
		color: "#fafafa",
		flex: 1,
	},
	typeRight: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	typeBadge: {
		backgroundColor: "#27272a",
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 6,
	},
	typeBadgeText: {
		fontSize: 10,
		fontWeight: "700",
		color: "#a1a1aa",
	},
	typeDesc: {
		fontSize: 11,
		color: "#71717a",
		lineHeight: 16,
	},
	inputWrapper: {
		paddingTop: 4,
	},
});
