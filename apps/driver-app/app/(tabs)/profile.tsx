import { useEffect, useState } from "react";
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	Switch,
	ActivityIndicator,
	Alert,
	Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	UserCheck,
	Star,
	ShieldCheck,
	Route,
	Award,
	Building2,
	LogOut,
	CreditCard,
	Phone,
	Calendar,
	Activity,
	AlertTriangle,
	AlertCircle,
	Coins,
	Clock,
	Briefcase,
	Edit2,
} from "lucide-react-native";
import { useTRPC } from "@/lib/trpc";
import { authClient } from "@/lib/auth-client";
import { DriverFeedback } from "@/lib/haptics";
import { useTranslation } from "react-i18next";
import { getActiveTelemetryHealth } from "@/lib/telemetry";


export default function DriverProfileScreen() {
	const { t } = useTranslation("passport");
	const router = useRouter();
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	// Phase 29 (F-TM-13) — live telemetry health, refreshed while mounted.
	const [health, setHealth] = useState(getActiveTelemetryHealth());
	useEffect(() => {
		const timer = setInterval(() => setHealth(getActiveTelemetryHealth()), 5000);
		return () => clearInterval(timer);
	}, []);

	// Real tRPC queries for driver profile & earnings & active shift
	const { data: profile, isLoading: isProfileLoading, refetch: refetchProfile } = useQuery(
		trpc.drivers.getMyProfile.queryOptions()
	);

	const { data: earnings, isLoading: isEarningsLoading } = useQuery(
		trpc.drivers.getMyEarnings.queryOptions()
	);

	const { data: currentShift, refetch: refetchShift } = useQuery(
		trpc.drivers.getMyCurrentShift.queryOptions()
	);

	// Marketplace preference query
	const { data: prefData } = useQuery(
		trpc.drivers.getMyServicePreference.queryOptions()
	);
	const servicePreference = prefData?.preference;

	// Shift toggle mutation
	const toggleShiftMutation = useMutation(
		trpc.drivers.toggleShift.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries();
			},
		})
	);

	// Availability toggle mutation (for marketplace)
	const setPreferenceMutation = useMutation(
		trpc.drivers.setServicePreference.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.drivers.getMyServicePreference.queryKey() });
			},
		})
	);


	const isShiftActive = !!currentShift;
	const elapsedMinutes = currentShift
		? Math.max(0, Math.round((Date.now() - new Date(currentShift.startedAt).getTime()) / 60000))
		: 0;

	const handleToggleShift = async (val: boolean) => {
		DriverFeedback.tap();
		try {
			await toggleShiftMutation.mutateAsync({
				onDuty: val,
			});
			DriverFeedback.successScan();
		} catch (err: any) {
			DriverFeedback.invalidScan();
			Alert.alert("Shift Error", err.message || "Failed to update driver shift.");
		}
	};

	const handleSignOut = () => {
		Alert.alert("Sign Out", "Are you sure you want to sign out of your driver account?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Sign Out",
				style: "destructive",
				onPress: async () => {
					DriverFeedback.tap();
					try {
						await authClient.signOut();
					} catch {}
					router.replace("/(auth)/login");
				},
			},
		]);
	};

	const handleCallCarrier = (phone?: string | null) => {
		if (!phone) return;
		DriverFeedback.tap();
		Linking.openURL(`tel:${phone}`).catch(() => {});
	};

	const driverName = profile?.user?.fullName ?? "Commercial Driver";
	const initials = driverName
		.split(" ")
		.map((n: string) => n[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();

	return (
		<SafeAreaView className="flex-1 bg-zinc-950">
			{/* Top Passport Header */}
			<View className="px-5 py-4 border-b border-zinc-800 bg-zinc-900/60">
				<Text className="text-xl font-black text-white tracking-tight">
					Driver Career Passport
				</Text>
				<Text className="text-xs text-zinc-400 mt-0.5">
					Universal portable driver identity across Moja Ride operators
				</Text>
			</View>

			<ScrollView className="flex-1 px-5 py-4 space-y-4">
				{/* Driver ID Card */}
				<View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
					<View className="flex-row items-center justify-between">
						<View className="flex-row items-center gap-3.5 flex-1">
							<View className="size-14 rounded-2xl bg-rose-600/10 border border-rose-500/20 items-center justify-center">
								<Text className="text-xl font-black text-rose-500">{initials}</Text>
							</View>
							<View className="flex-1">
								<Text className="text-lg font-black text-white" numberOfLines={1}>
									{driverName}
								</Text>
								<View className="flex-row items-center gap-1.5 mt-0.5">
									<ShieldCheck size={14} color="#10b981" />
									<Text className="text-xs text-emerald-400 font-semibold">
										{profile?.licenseCategory
											? `Class ${profile.licenseCategory} Commercial`
											: "Verified Commercial Driver"}
									</Text>
								</View>
								<Text className="text-[11px] text-zinc-500 font-mono mt-0.5">
									Lic: {profile?.licenseNumber ?? "N/A"}
								</Text>
							</View>
						</View>
					</View>

					{/* Shift On-Duty Toggle */}
				<View className="flex-row items-center justify-between bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800">
					<View className="flex-1 pr-3">
						<Text className="text-sm font-bold text-white">On-Duty Shift Status</Text>
						<Text className="text-xs text-zinc-400 mt-0.5">
							{isShiftActive
								? `Clocked in (${elapsedMinutes}m active)`
								: "Off-duty / Resting"}
						</Text>
					</View>
					{toggleShiftMutation.isPending ? (
						<ActivityIndicator size="small" color="#e11d48" />
					) : (
						<Switch
							value={isShiftActive}
							onValueChange={handleToggleShift}
							trackColor={{ false: "#3f3f46", true: "#e11d48" }}
							thumbColor="#ffffff"
						/>
					)}
				</View>

				{/* Marketplace Availability Toggle */}
				<View className="flex-row items-center justify-between bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800">
					<View className="flex-1 pr-3">
						<View className="flex-row items-center gap-1.5">
							<Briefcase size={14} color="#71717a" />
							<Text className="text-sm font-bold text-white">Available for Hire</Text>
						</View>
						<Text className="text-xs text-zinc-400 mt-0.5">
							{servicePreference?.isAvailableForHire
								? "Visible to operators in marketplace"
								: "Hidden from operator marketplace"}
						</Text>
					</View>
					{setPreferenceMutation.isPending ? (
						<ActivityIndicator size="small" color="#e11d48" />
					) : (
						<Switch
							value={servicePreference?.isAvailableForHire ?? false}
							onValueChange={async (val) => {
								DriverFeedback.tap();
								try {
									await setPreferenceMutation.mutateAsync({
										isAvailableForHire: val,
										preferredType: servicePreference?.preferredType ?? "EXCLUSIVE_INTERCITY",
										cityBase: servicePreference?.cityBase ?? null,
										routeExperience: servicePreference?.routeExperience ?? [],
										minMonthlyRateCFA: null,
									});
									DriverFeedback.successScan();
								} catch (err: any) {
									DriverFeedback.invalidScan();
									Alert.alert("Erreur", err.message || "Impossible de mettre à jour.");
								}
							}}
							trackColor={{ false: "#3f3f46", true: "#10b981" }}
							thumbColor="#ffffff"
						/>
					)}
				</View>

				{/* Edit Marketplace Profile Link */}
				<TouchableOpacity
					onPress={() => {
						DriverFeedback.tap();
						router.push("/(auth)/preferences");
					}}
					className="flex-row items-center justify-between bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800"
				>
					<View className="flex-row items-center gap-2 flex-1">
						<Edit2 size={16} color="#38bdf8" />
						<View>
							<Text className="text-sm font-bold text-sky-400">
								Edit Marketplace Profile
							</Text>
							<Text className="text-xs text-zinc-500 mt-0.5">
								{servicePreference?.cityBase
									? `Hub: ${servicePreference.cityBase} · ${servicePreference.routeExperience?.length ?? 0} routes`
									: "Set city, employment type, route experience"}
							</Text>
						</View>
					</View>
					<Briefcase size={16} color="#52525b" />
				</TouchableOpacity>

				</View>

				{/* Earnings Summary Card */}
				<View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-sm space-y-3">
					<View className="flex-row items-center justify-between">
						<View className="flex-row items-center gap-2">
							<Coins size={18} color="#f59e0b" />
							<Text className="text-xs font-bold text-zinc-400 uppercase">
								Earnings Overview
							</Text>
						</View>
						<Text className="text-xs font-mono font-bold text-emerald-400">
							XOF Currency
						</Text>
					</View>

					<View className="flex-row items-baseline gap-2 pt-1">
						<Text className="text-3xl font-black text-white font-mono">
							{(earnings?.todayEarningsXof ?? 0).toLocaleString()}
						</Text>
						<Text className="text-xs font-bold text-zinc-400">XOF Today</Text>
					</View>

					<View className="flex-row items-center justify-between bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/40">
						<View className="flex-row items-center gap-1.5">
							<Clock size={13} color="#71717a" />
							<Text className="text-xs text-zinc-300">
								{currentShift ? `${elapsedMinutes}m shift` : "Shift inactive"}
							</Text>
						</View>
						<Text className="text-xs text-zinc-400 font-semibold">
							Weekly: {(earnings?.weekEarningsXof ?? 0).toLocaleString()} XOF
						</Text>
					</View>
				</View>

				{/* Phase 29 (F-TM-13) — Telemetry Health: the producer is honest
				    about itself — tracking mode, offline queue depth, re-auth.
				    Phase 38 — strings via passport namespace. */}
				<View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-sm space-y-3">
					<View className="flex-row items-center justify-between">
						<View className="flex-row items-center gap-2">
							<Activity size={18} color="#38bdf8" />
							<Text className="text-xs font-bold text-zinc-400 uppercase">
								{t("telemetryHealth")}
							</Text>
						</View>
						<Text
							className={`text-xs font-bold ${
								health.needsReauth
									? "text-rose-400"
									: health.adaptiveMode === "OFFLINE"
										? "text-zinc-500"
										: "text-emerald-400"
							}`}
						>
							{health.adaptiveMode === "HIGH_RATE"
								? t("streaming")
								: health.adaptiveMode === "STATIONARY"
									? t("idleTracking")
									: t("offline")}
						</Text>
					</View>

					<View className="flex-row items-center justify-between bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/40">
						<View className="flex-row items-center gap-1.5">
							<Clock size={13} color="#71717a" />
							<Text className="text-xs text-zinc-300">
								{health.lastPingAt
									? t("pingAgo", {
											minutes: Math.max(
												0,
												Math.round(
													(Date.now() -
														new Date(health.lastPingAt).getTime()) /
														60000,
												),
											),
										})
									: t("noPingYet")}
							</Text>
						</View>
						<Text className="text-xs text-zinc-400 font-semibold">
							{t("queued", { count: health.queueLength })}
						</Text>
					</View>

					{health.needsReauth && (
						<View className="flex-row items-center gap-2 bg-rose-950/40 border border-rose-900/50 p-3 rounded-xl">
							<AlertTriangle size={14} color="#fb7185" />
							<Text className="text-xs text-rose-300 flex-1">
								{t("reauthHint")}
							</Text>
						</View>
					)}
				</View>

				{/* Lifetime Career Achievements */}
				<View className="grid grid-cols-2 gap-3 flex-row flex-wrap">
					<View className="flex-1 min-w-[140px] bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
						<View className="flex-row items-center gap-2 mb-2">
							<Star size={18} color="#f59e0b" fill="#f59e0b" />
							<Text className="text-xs text-zinc-400 font-bold">Rating</Text>
						</View>
						<Text className="text-2xl font-black text-white font-mono">
							{(earnings?.averageRating ?? 5.0).toFixed(2)}
						</Text>
						<Text className="text-[10px] text-zinc-500 mt-0.5">
							{profile?._count?.reviews ?? 0} verified reviews
						</Text>
					</View>

					<View className="flex-1 min-w-[140px] bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
						<View className="flex-row items-center gap-2 mb-2">
							<ShieldCheck size={18} color="#10b981" />
							<Text className="text-xs text-zinc-400 font-bold">Safety Index</Text>
						</View>
						<Text className="text-2xl font-black text-emerald-400 font-mono">
							{earnings?.safetyScore ?? profile?.safetyScore ?? 98}/100
						</Text>
						<Text className="text-[10px] text-zinc-500 mt-0.5">Zero incident record</Text>
					</View>

					<View className="flex-1 min-w-[140px] bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
						<View className="flex-row items-center gap-2 mb-2">
							<Route size={18} color="#38bdf8" />
							<Text className="text-xs text-zinc-400 font-bold">Journeys</Text>
						</View>
						<Text className="text-2xl font-black text-white font-mono">
							{profile?.totalTripsCompleted ?? earnings?.totalTripsCompleted ?? 0}
						</Text>
						<Text className="text-[10px] text-zinc-500 mt-0.5">Completed runs</Text>
					</View>

					<View className="flex-1 min-w-[140px] bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
						<View className="flex-row items-center gap-2 mb-2">
							<Award size={18} color="#a855f7" />
							<Text className="text-xs text-zinc-400 font-bold">Distance</Text>
						</View>
						<Text className="text-2xl font-black text-white font-mono">
							{Math.round(profile?.totalDistanceKm ?? earnings?.totalDistanceKm ?? 0).toLocaleString()}
						</Text>
						<Text className="text-[10px] text-zinc-500 mt-0.5">km logged</Text>
					</View>
				</View>

				{/* Affiliated Carriers */}
				<View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
					<Text className="text-xs font-bold text-zinc-400 uppercase">
						Active Carrier Affiliations
					</Text>

					{profile?.companyAffiliations && profile.companyAffiliations.length > 0 ? (
						profile.companyAffiliations.map((aff: any) => (
							<View
								key={aff.id}
								className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex-row items-center justify-between mb-2"
							>
								<View className="flex-row items-center gap-3 flex-1 mr-2">
									<Building2 size={18} color="#e11d48" />
									<View className="flex-1">
										<Text className="text-sm font-bold text-white" numberOfLines={1}>
											{aff.company?.name ?? "Commercial Carrier"}
										</Text>
										<Text className="text-xs text-zinc-400 font-mono">
											Code: {aff.companyBadgeNumber ?? aff.company?.slug ?? "Active"}
										</Text>
									</View>
								</View>

								{aff.company?.phone && (
									<TouchableOpacity
										onPress={() => handleCallCarrier(aff.company.phone)}
										className="size-8 rounded-lg bg-zinc-800 items-center justify-center border border-zinc-700 mr-2"
									>
										<Phone size={14} color="#38bdf8" />
									</TouchableOpacity>
								)}

								<Text className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
									Active
								</Text>
							</View>
						))
					) : (
						<View className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex-row items-center justify-between">
							<View className="flex-row items-center gap-3">
								<Building2 size={18} color="#e11d48" />
								<View>
									<Text className="text-sm font-bold text-white">
										UTB Intercity Express
									</Text>
									<Text className="text-xs text-zinc-400">
										Direct Carrier Contract • Badge: DRV-084
									</Text>
								</View>
							</View>
							<Text className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
								Active
							</Text>
						</View>
					)}
				</View>

				{/* Sign out button */}
				<TouchableOpacity
					onPress={handleSignOut}
					className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex-row items-center justify-center gap-2 mt-4 mb-8"
				>
					<LogOut size={16} color="#ef4444" />
					<Text className="text-sm font-bold text-rose-500">Sign Out</Text>
				</TouchableOpacity>
			</ScrollView>
		</SafeAreaView>
	);
}
