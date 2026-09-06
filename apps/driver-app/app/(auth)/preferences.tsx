import { useState, useEffect } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	ActivityIndicator,
	Alert,
	Switch,
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
					icon={<HugeiconsIcon icon={ArrowRight01Icon} size={18} color={colors.neutral.textPrimary} />}
					iconPosition="right"
				/>
			}
		>
			{isLoadingPref ? (
				<View className="items-center justify-center py-12">
					<ActivityIndicator size="large" color={colors.primary.rose} />
				</View>
			) : (
				<View className="gap-4">
					{/* Marketplace Availability Card */}
					<Card className="p-5 gap-3">
						<View className="flex-row items-center justify-between">
							<View className="flex-row items-center gap-2.5 flex-1 pr-2">
								<View className="w-9 h-9 rounded-xl bg-primary/15 items-center justify-center">
									<HugeiconsIcon icon={Briefcase01Icon} size={20} color={colors.primary.rose} />
								</View>
								<View className="flex-1 gap-0.5">
									<Text className="text-sm font-extrabold text-foreground">
										{isEn ? "Marketplace Availability" : "Disponibilité Recrutement"}
									</Text>
									<Text className="text-xs text-muted-foreground leading-4">
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
								trackColor={{ false: colors.neutral.border, true: colors.primary.rose }}
								thumbColor={colors.neutral.textPrimary}
							/>
						</View>
					</Card>

					{/* Preferred Service Type */}
					<Card className="p-5 gap-3">
						<Text className="text-sm font-extrabold text-foreground">
							{isEn ? "Operation Mode" : "Mode d'Opération Principal"}
						</Text>
						<Text className="text-xs text-muted-foreground">
							{isEn
								? "Choose your primary driving engagement"
								: "Choisissez votre spécialité de conduite"}
						</Text>

						<View className="gap-2.5 pt-1">
							{EMPLOYMENT_OPTIONS.map((opt) => {
								const isSelected = preferredType === opt.value;
								return (
									<Button
										key={opt.value}
										onPress={() => {
											DriverFeedback.tap();
											setPreferredType(opt.value);
										}}
										variant={isSelected ? "primary" : "outline"}
										size="md"
										className={`p-3.5 h-auto rounded-2xl items-start justify-start border-1.5 gap-1 ${
											isSelected
												? "border-primary bg-primary/10"
												: "border-border bg-background"
										}`}
									>
										<View className="flex-row items-center justify-between w-full">
											<Text
												className={`text-sm font-bold ${
													isSelected ? "text-primary" : "text-foreground"
												}`}
											>
												{isEn ? opt.labelEn : opt.label}
											</Text>
											{isSelected ? (
												<HugeiconsIcon
													icon={CheckmarkCircle02Icon}
													size={18}
													color={colors.primary.rose}
												/>
											) : null}
										</View>
										<Text className="text-xs text-muted-foreground leading-4">{opt.description}</Text>
									</Button>
								);
							})}
						</View>
					</Card>

					{/* City Base */}
					<Card className="p-5 gap-3">
						<View className="flex-row items-center gap-2">
							<HugeiconsIcon icon={Location01Icon} size={18} color={colors.primary.rose} />
							<Text className="text-sm font-extrabold text-foreground">
								{isEn ? "Base City (Hub)" : "Ville de Base (Gare Principale)"}
							</Text>
						</View>

						<View className="flex-row flex-wrap gap-2 pt-1">
							{CIV_CITY_HUBS.map((city) => {
								const isSelected = cityBase === city;
								return (
									<Button
										key={city}
										onPress={() => {
											DriverFeedback.tap();
											setCityBase(city);
										}}
										variant={isSelected ? "primary" : "outline"}
										size="sm"
										className={`px-3.5 py-2 h-auto rounded-xl border ${
											isSelected
												? "border-primary bg-primary"
												: "border-border bg-background"
										}`}
									>
										<Text
											className={`text-xs font-semibold ${
												isSelected ? "text-primary-foreground font-bold" : "text-foreground"
											}`}
										>
											{city}
										</Text>
									</Button>
								);
							})}
						</View>
					</Card>

					{/* Route Experience */}
					<Card className="p-5 gap-3">
						<View className="flex-row items-center gap-2">
							<HugeiconsIcon icon={Route01Icon} size={18} color={colors.primary.rose} />
							<Text className="text-sm font-extrabold text-foreground">
								{isEn ? "Route Experience" : "Itinéraires Maîtrisés"}
							</Text>
						</View>

						<View className="flex-row items-center gap-2">
							<TextInput
								value={routeInput}
								onChangeText={setRouteInput}
								placeholder="ex: Abidjan - Bouaké"
								placeholderTextColor={colors.neutral.textMuted}
								className="flex-1 h-12 rounded-xl border border-border bg-background px-3.5 text-foreground text-sm"
							/>
							<Button
								onPress={handleAddRoute}
								size="sm"
								className="w-12 h-12 p-0 rounded-xl bg-primary items-center justify-center"
							>
								<HugeiconsIcon icon={Add01Icon} size={18} color={colors.neutral.textPrimary} />
							</Button>
						</View>

						{routeExperience.length > 0 ? (
							<View className="flex-row flex-wrap gap-2 pt-1">
								{routeExperience.map((r) => (
									<View key={r} className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-border">
										<Text className="text-xs text-foreground font-medium">{r}</Text>
										<Button
											onPress={() => handleRemoveRoute(r)}
											variant="ghost"
											size="sm"
											className="p-0.5 h-auto min-h-0 w-auto"
										>
											<HugeiconsIcon icon={Cancel01Icon} size={12} color={colors.neutral.textSecondary} />
										</Button>
									</View>
								))}
							</View>
						) : null}
					</Card>
				</View>
			)}
		</ScreenShell>
	);
}
