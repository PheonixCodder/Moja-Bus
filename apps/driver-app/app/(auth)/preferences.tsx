import { useState, useEffect } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	ActivityIndicator,
	Alert,
	Switch,
	StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
	Briefcase01Icon,
	Location01Icon,
	Route01Icon,
	CheckmarkCircle02Icon,
	Cancel01Icon,
	Add01Icon,
	ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { useTranslation } from "react-i18next";
import { useTRPC } from "@/lib/trpc";
import { DriverFeedback } from "@/lib/haptics";
import { CIV_CITY_HUBS } from "@moja/schemas";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { colors } from "@/constants/theme";

const EMPLOYMENT_OPTIONS = [
	{
		value: "EXCLUSIVE_INTERCITY" as const,
		label: "Transporteur Intercity Exclusif",
		labelEn: "Exclusive Intercity Carrier",
		description: "Itinéraires longue distance programmés avec des shifts garantis.",
	},
	{
		value: "CONTRACTOR_URBAN" as const,
		label: "Contractant Urbain",
		labelEn: "Urban Contractor",
		description: "Navettes urbaines flexibles et dispatches de relève.",
	},
	{
		value: "HYBRID" as const,
		label: "Hybride (Intercity & Urbain)",
		labelEn: "Hybrid (Intercity & Urban)",
		description: "Disponible pour les deux types d'opérations.",
	},
] as const;

type EmploymentType = "EXCLUSIVE_INTERCITY" | "CONTRACTOR_URBAN" | "HYBRID";

export default function DriverPreferencesScreen() {
	const router = useRouter();
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { i18n } = useTranslation("auth");
	const isEn = i18n.language === "en";

	const { data: existingPref, isLoading: isLoadingPref } = useQuery(
		trpc.drivers.getMyServicePreference.queryOptions()
	);

	const pref = existingPref?.preference;

	const [isAvailableForHire, setIsAvailableForHire] = useState(false);
	const [preferredType, setPreferredType] = useState<EmploymentType>("EXCLUSIVE_INTERCITY");
	const [cityBase, setCityBase] = useState("");
	const [routeExperience, setRouteExperience] = useState<string[]>([]);
	const [routeInput, setRouteInput] = useState("");

	useEffect(() => {
		if (pref) {
			setIsAvailableForHire(pref.isAvailableForHire ?? false);
			setPreferredType((pref.preferredType as EmploymentType) ?? "EXCLUSIVE_INTERCITY");
			setCityBase(pref.cityBase ?? "");
			setRouteExperience(pref.routeExperience ?? []);
		}
	}, [pref]);

	const saveMutation = useMutation(
		trpc.drivers.setServicePreference.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries();
				DriverFeedback.successScan();
			},
		})
	);

	const handleAddRoute = () => {
		const trimmed = routeInput.trim();
		if (!trimmed) return;
		if (routeExperience.length >= 20) {
			Alert.alert("Limite atteinte", "Maximum 20 itinéraires.");
			return;
		}
		if (!routeExperience.includes(trimmed)) {
			setRouteExperience((prev) => [...prev, trimmed]);
		}
		setRouteInput("");
	};

	const handleRemoveRoute = (route: string) => {
		setRouteExperience((prev) => prev.filter((r) => r !== route));
	};

	const handleSave = async () => {
		if (!cityBase) {
			Alert.alert(
				isEn ? "City Base Required" : "Ville de base requise",
				isEn
					? "Please select your primary operating city."
					: "Veuillez sélectionner votre ville de départ principale."
			);
			return;
		}

		try {
			DriverFeedback.tap();
			await saveMutation.mutateAsync({
				isAvailableForHire,
				preferredType,
				cityBase,
				routeExperience,
			});
			router.replace("/(tabs)/trips");
		} catch (err: any) {
			Alert.alert(
				isEn ? "Save Failed" : "Échec de l'enregistrement",
				err?.message ?? "Une erreur est survenue."
			);
		}
	};

	return (
		<ScreenShell
			header={
				<PageHeader
					title={isEn ? "Driver Preferences" : "Préférences de Service"}
					subtitle={
						isEn
							? "Configure your marketplace availability"
							: "Configurez votre visibilité sur la marketplace"
					}
					showBack={false}
				/>
			}
			footer={
				<Button
					title={isEn ? "Save & Continue" : "Enregistrer et Continuer"}
					variant="primary"
					size="lg"
					loading={saveMutation.isPending}
					onPress={handleSave}
					icon={<HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#ffffff" />}
					iconPosition="right"
				/>
			}
		>
			{isLoadingPref ? (
				<View style={styles.loadingBox}>
					<ActivityIndicator size="large" color={colors.primary.rose} />
				</View>
			) : (
				<View style={styles.formContainer}>
					{/* Marketplace Availability Card */}
					<View style={styles.card}>
						<View style={styles.cardHeaderRow}>
							<View style={styles.iconTitleRow}>
								<View style={styles.iconCircle}>
									<HugeiconsIcon icon={Briefcase01Icon} size={20} color="#ee237c" />
								</View>
								<View style={styles.titleWrap}>
									<Text style={styles.cardTitle}>
										{isEn ? "Marketplace Availability" : "Disponibilité Recrutement"}
									</Text>
									<Text style={styles.cardSubtitle}>
										{isEn
											? "Allow carriers to discover and send you trip offers"
											: "Permettre aux compagnies de vous proposer des missions"}
									</Text>
								</View>
							</View>
							<Switch
								value={isAvailableForHire}
								onValueChange={(val) => {
									DriverFeedback.tap();
									setIsAvailableForHire(val);
								}}
								trackColor={{ false: "#27272a", true: "#ee237c" }}
								thumbColor="#fafafa"
							/>
						</View>
					</View>

					{/* Preferred Service Type */}
					<View style={styles.card}>
						<Text style={styles.cardTitle}>
							{isEn ? "Operation Mode" : "Mode d'Opération Principal"}
						</Text>
						<Text style={styles.cardSubtitle}>
							{isEn
								? "Choose your primary driving engagement"
								: "Choisissez votre spécialité de conduite"}
						</Text>

						<View style={styles.optionsList}>
							{EMPLOYMENT_OPTIONS.map((opt) => {
								const isSelected = preferredType === opt.value;
								return (
									<TouchableOpacity
										key={opt.value}
										onPress={() => {
											DriverFeedback.tap();
											setPreferredType(opt.value);
										}}
										activeOpacity={0.8}
										style={[
											styles.optionCard,
											isSelected && styles.optionCardSelected,
										]}
									>
										<View style={styles.optionHeader}>
											<Text
												style={[
													styles.optionLabel,
													isSelected && styles.optionLabelSelected,
												]}
											>
												{isEn ? opt.labelEn : opt.label}
											</Text>
											{isSelected ? (
												<HugeiconsIcon
													icon={CheckmarkCircle02Icon}
													size={18}
													color="#ee237c"
												/>
											) : null}
										</View>
										<Text style={styles.optionDesc}>{opt.description}</Text>
									</TouchableOpacity>
								);
							})}
						</View>
					</View>

					{/* City Base */}
					<View style={styles.card}>
						<View style={styles.iconTitleRow}>
							<HugeiconsIcon icon={Location01Icon} size={18} color="#ee237c" />
							<Text style={styles.cardTitle}>
								{isEn ? "Base City (Hub)" : "Ville de Base (Gare Principale)"}
							</Text>
						</View>

						<View style={styles.hubsWrap}>
							{CIV_CITY_HUBS.map((city) => {
								const isSelected = cityBase === city;
								return (
									<TouchableOpacity
										key={city}
										onPress={() => {
											DriverFeedback.tap();
											setCityBase(city);
										}}
										activeOpacity={0.8}
										style={[
											styles.hubChip,
											isSelected && styles.hubChipSelected,
										]}
									>
										<Text
											style={[
												styles.hubText,
												isSelected && styles.hubTextSelected,
											]}
										>
											{city}
										</Text>
									</TouchableOpacity>
								);
							})}
						</View>
					</View>

					{/* Route Experience */}
					<View style={styles.card}>
						<View style={styles.iconTitleRow}>
							<HugeiconsIcon icon={Route01Icon} size={18} color="#ee237c" />
							<Text style={styles.cardTitle}>
								{isEn ? "Route Experience" : "Itinéraires Maîtrisés"}
							</Text>
						</View>

						<View style={styles.routeInputRow}>
							<TextInput
								value={routeInput}
								onChangeText={setRouteInput}
								placeholder="ex: Abidjan - Bouaké"
								placeholderTextColor="#52525b"
								style={styles.routeTextInput}
							/>
							<TouchableOpacity
								onPress={handleAddRoute}
								style={styles.addRouteBtn}
							>
								<HugeiconsIcon icon={Add01Icon} size={18} color="#ffffff" />
							</TouchableOpacity>
						</View>

						{routeExperience.length > 0 ? (
							<View style={styles.routeChipsWrap}>
								{routeExperience.map((r) => (
									<View key={r} style={styles.routeChip}>
										<Text style={styles.routeChipText}>{r}</Text>
										<TouchableOpacity
											onPress={() => handleRemoveRoute(r)}
											style={styles.removeRouteBtn}
										>
											<HugeiconsIcon icon={Cancel01Icon} size={12} color="#a1a1aa" />
										</TouchableOpacity>
									</View>
								))}
							</View>
						) : null}
					</View>
				</View>
			)}
		</ScreenShell>
	);
}

const styles = StyleSheet.create({
	loadingBox: {
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 48,
	},
	formContainer: {
		gap: 16,
	},
	card: {
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
	iconTitleRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		flex: 1,
	},
	iconCircle: {
		width: 36,
		height: 36,
		borderRadius: 12,
		backgroundColor: "rgba(238, 35, 124, 0.12)",
		alignItems: "center",
		justifyContent: "center",
	},
	titleWrap: {
		flex: 1,
		gap: 2,
	},
	cardTitle: {
		fontSize: 15,
		fontWeight: "800",
		color: "#fafafa",
	},
	cardSubtitle: {
		fontSize: 12,
		color: "#a1a1aa",
		lineHeight: 16,
	},
	optionsList: {
		gap: 10,
		paddingTop: 4,
	},
	optionCard: {
		padding: 14,
		borderRadius: 16,
		borderWidth: 1.5,
		borderColor: "#27272a",
		backgroundColor: "#09090b",
		gap: 4,
	},
	optionCardSelected: {
		borderColor: "#ee237c",
		backgroundColor: "rgba(238, 35, 124, 0.06)",
	},
	optionHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	optionLabel: {
		fontSize: 14,
		fontWeight: "700",
		color: "#fafafa",
	},
	optionLabelSelected: {
		color: "#ee237c",
	},
	optionDesc: {
		fontSize: 11,
		color: "#71717a",
		lineHeight: 16,
	},
	hubsWrap: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
		paddingTop: 4,
	},
	hubChip: {
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: "#27272a",
		backgroundColor: "#09090b",
	},
	hubChipSelected: {
		borderColor: "#ee237c",
		backgroundColor: "#ee237c",
	},
	hubText: {
		fontSize: 12,
		fontWeight: "600",
		color: "#d4d4d8",
	},
	hubTextSelected: {
		color: "#ffffff",
	},
	routeInputRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	routeTextInput: {
		flex: 1,
		height: 48,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#27272a",
		backgroundColor: "#09090b",
		paddingHorizontal: 14,
		color: "#fafafa",
		fontSize: 14,
	},
	addRouteBtn: {
		width: 48,
		height: 48,
		borderRadius: 12,
		backgroundColor: "#ee237c",
		alignItems: "center",
		justifyContent: "center",
	},
	routeChipsWrap: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
		paddingTop: 4,
	},
	routeChip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 8,
		backgroundColor: "#27272a",
	},
	routeChipText: {
		fontSize: 12,
		color: "#fafafa",
	},
	removeRouteBtn: {
		padding: 2,
	},
});
