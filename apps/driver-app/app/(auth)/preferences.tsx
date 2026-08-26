import { useState } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	ScrollView,
	ActivityIndicator,
	Alert,
	Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	MapPin,
	Route,
	Briefcase,
	ChevronRight,
	CheckCircle,
	ArrowRight,
	X,
	Plus,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useTRPC } from "@/lib/trpc";
import { DriverFeedback } from "@/lib/haptics";
import { CIV_CITY_HUBS } from "@moja/schemas";

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
	const { t, i18n } = useTranslation("auth");
	const isEn = i18n.language === "en";

	// Load existing preferences (if returning to edit)
	const { data: existingPref, isLoading: isLoadingPref } = useQuery(
		trpc.drivers.getMyServicePreference.queryOptions()
	);

	const pref = existingPref?.preference;

	const [isAvailableForHire, setIsAvailableForHire] = useState(
		pref?.isAvailableForHire ?? false
	);
	const [preferredType, setPreferredType] = useState<EmploymentType>(
		(pref?.preferredType as EmploymentType) ?? "EXCLUSIVE_INTERCITY"
	);
	const [cityBase, setCityBase] = useState(pref?.cityBase ?? "");
	const [showCityPicker, setShowCityPicker] = useState(false);
	const [routeExperience, setRouteExperience] = useState<string[]>(
		pref?.routeExperience ?? []
	);
	const [routeInput, setRouteInput] = useState("");

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

	const handleSave = async (skipToApp = false) => {
		DriverFeedback.tap();
		try {
			await saveMutation.mutateAsync({
				isAvailableForHire,
				preferredType,
				cityBase: cityBase.trim() || null,
				routeExperience,
			});
			router.replace("/(tabs)/trips");
		} catch (err: any) {
			DriverFeedback.invalidScan();
			Alert.alert("Erreur", err.message || "Impossible de sauvegarder les préférences.");
		}
	};

	const handleSkip = async () => {
		DriverFeedback.tap();
		// Save minimal default record so we don't show this screen again
		try {
			await saveMutation.mutateAsync({
				isAvailableForHire: false,
				preferredType: "EXCLUSIVE_INTERCITY",
				cityBase: null,
				routeExperience: [],
			});
		} catch {
			// Ignore skip errors — proceed anyway
		}
		router.replace("/(tabs)/trips");
	};

	if (isLoadingPref) {
		return (
			<View className="flex-1 items-center justify-center bg-zinc-950">
				<ActivityIndicator size="large" color="#e11d48" />
			</View>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-zinc-950">
			{/* Header */}
			<View className="px-5 py-4 border-b border-zinc-800 bg-zinc-900/60 flex-row items-center justify-between">
				<View className="flex-1">
					<Text className="text-lg font-black text-white tracking-tight">
						Profil Marketplace
					</Text>
					<Text className="text-xs text-zinc-400 mt-0.5">
						Soyez découvert par les opérateurs de bus
					</Text>
				</View>
				<TouchableOpacity
					onPress={handleSkip}
					className="px-3 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700"
				>
					<Text className="text-xs font-semibold text-zinc-400">
						{isEn ? "Skip" : "Ignorer"}
					</Text>
				</TouchableOpacity>
			</View>

			<ScrollView className="flex-1 px-5 py-5 space-y-5">
				{/* Available for Hire Toggle */}
				<View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex-row items-center justify-between">
					<View className="flex-1 pr-4">
						<Text className="text-sm font-bold text-white">
							{isEn ? "Available for Hire" : "Disponible pour recrutement"}
						</Text>
						<Text className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
							{isEn
								? "Let operators discover your profile in the driver marketplace"
								: "Permettre aux opérateurs de trouver votre profil dans la marketplace"}
						</Text>
					</View>
					<Switch
						value={isAvailableForHire}
						onValueChange={(val) => {
							DriverFeedback.tap();
							setIsAvailableForHire(val);
						}}
						trackColor={{ false: "#3f3f46", true: "#e11d48" }}
						thumbColor="#ffffff"
					/>
				</View>

				{/* Employment Type */}
				<View className="space-y-2">
					<View className="flex-row items-center gap-2 mb-1">
						<Briefcase size={16} color="#71717a" />
						<Text className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
							{isEn ? "Employment Preference" : "Type d'emploi préféré"}
						</Text>
					</View>
					{EMPLOYMENT_OPTIONS.map((opt) => (
						<TouchableOpacity
							key={opt.value}
							onPress={() => {
								DriverFeedback.tap();
								setPreferredType(opt.value);
							}}
							className={`p-4 rounded-2xl border flex-row items-start justify-between ${
								preferredType === opt.value
									? "bg-rose-600/10 border-rose-500"
									: "bg-zinc-900 border-zinc-800"
							}`}
						>
							<View className="flex-1 pr-3">
								<Text
									className={`text-sm font-bold ${
										preferredType === opt.value ? "text-rose-400" : "text-white"
									}`}
								>
									{isEn ? opt.labelEn : opt.label}
								</Text>
								<Text className="text-xs text-zinc-400 mt-1 leading-relaxed">
									{opt.description}
								</Text>
							</View>
							{preferredType === opt.value && (
								<CheckCircle size={20} color="#e11d48" />
							)}
						</TouchableOpacity>
					))}
				</View>

				{/* City Base */}
				<View className="space-y-2">
					<View className="flex-row items-center gap-2 mb-1">
						<MapPin size={16} color="#71717a" />
						<Text className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
							{isEn ? "Base City / Hub" : "Ville de départ / Hub"}
						</Text>
					</View>

					{/* Hub chips only — no free-text input */}
					<View className="flex-row flex-wrap gap-2">
						{CIV_CITY_HUBS.map((city) => (
							<TouchableOpacity
								key={city}
								onPress={() => {
									DriverFeedback.tap();
									setCityBase(cityBase === city ? "" : city);
								}}
								className={`px-3 py-1.5 rounded-xl border ${
									cityBase === city
										? "bg-rose-600/15 border-rose-500"
										: "bg-zinc-900 border-zinc-800"
								}`}
							>
								<Text
									className={`text-xs font-semibold ${
										cityBase === city ? "text-rose-400" : "text-zinc-300"
									}`}
								>
									{city}
								</Text>
							</TouchableOpacity>
						))}
					</View>
				</View>

				{/* Route Experience */}
				<View className="space-y-2">
					<View className="flex-row items-center gap-2 mb-1">
						<Route size={16} color="#71717a" />
						<Text className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
							{isEn ? "Route Experience" : "Expérience de routes"}
						</Text>
					</View>
					<Text className="text-xs text-zinc-500 leading-relaxed">
						{isEn
							? "Add the city pairs you've driven before (e.g. Abidjan-Bouaké)"
							: "Ajoutez les trajets que vous avez effectués (ex: Abidjan-Bouaké)"}
					</Text>

					{/* Route input */}
					<View className="flex-row items-center gap-2">
						<View className="flex-1 flex-row items-center bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 h-11">
							<TextInput
								className="flex-1 text-white text-sm"
								placeholder={isEn ? "e.g. Abidjan-Yamoussoukro" : "ex: Abidjan-Yamoussoukro"}
								placeholderTextColor="#52525b"
								value={routeInput}
								onChangeText={setRouteInput}
								onSubmitEditing={handleAddRoute}
								returnKeyType="done"
							/>
						</View>
						<TouchableOpacity
							onPress={handleAddRoute}
							className="size-11 rounded-xl bg-rose-600 items-center justify-center"
						>
							<Plus size={18} color="#ffffff" />
						</TouchableOpacity>
					</View>

					{/* Route chips */}
					{routeExperience.length > 0 && (
						<View className="flex-row flex-wrap gap-2 mt-1">
							{routeExperience.map((route) => (
								<View
									key={route}
									className="flex-row items-center gap-1.5 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-1.5"
								>
									<Text className="text-xs font-semibold text-zinc-200">
										{route}
									</Text>
									<TouchableOpacity onPress={() => handleRemoveRoute(route)}>
										<X size={14} color="#71717a" />
									</TouchableOpacity>
								</View>
							))}
						</View>
					)}
				</View>

				{/* Save CTA */}
				<TouchableOpacity
					onPress={() => handleSave()}
					disabled={saveMutation.isPending}
					className="bg-rose-600 active:bg-rose-700 h-13 rounded-2xl items-center justify-center flex-row gap-2 mt-4 mb-8 shadow-xl shadow-rose-600/30"
				>
					{saveMutation.isPending ? (
						<ActivityIndicator size="small" color="#ffffff" />
					) : (
						<>
							<Text className="text-white font-black text-sm">
								{isEn ? "Save & Enter App" : "Enregistrer et accéder"}
							</Text>
							<ArrowRight size={18} color="#ffffff" />
						</>
					)}
				</TouchableOpacity>
			</ScrollView>
		</SafeAreaView>
	);
}
