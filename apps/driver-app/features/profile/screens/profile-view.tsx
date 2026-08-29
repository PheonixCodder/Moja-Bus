import React, { useEffect, useState } from "react";
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	Switch,
	ActivityIndicator,
	Alert,
	Linking,
	StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
	SecurityCheckIcon,
	StarIcon,
	Route01Icon,
	Award01Icon,
	Building01Icon,
	Logout01Icon,
	Call02Icon,
	Briefcase01Icon,
	Edit02Icon,
	Coins01Icon,
	Clock01Icon,
	Activity01Icon,
	Alert02Icon,
	Globe02Icon,
} from "@hugeicons/core-free-icons";
import { useTRPC } from "@/lib/trpc";
import { authClient } from "@/lib/auth-client";
import { DriverFeedback } from "@/lib/haptics";
import { useTranslation } from "react-i18next";
import { getActiveTelemetryHealth } from "@/lib/telemetry";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { colors } from "@/constants/theme";

export function ProfileView() {
	const { t } = useTranslation("passport");
	const router = useRouter();
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const insets = useSafeAreaInsets();

	const [health, setHealth] = useState(getActiveTelemetryHealth());
	useEffect(() => {
		const timer = setInterval(() => setHealth(getActiveTelemetryHealth()), 5000);
		return () => clearInterval(timer);
	}, []);

	const { data: profile } = useQuery(
		trpc.drivers.getMyProfile.queryOptions()
	);

	const { data: earnings } = useQuery(
		trpc.drivers.getMyEarnings.queryOptions()
	);

	const { data: currentShift } = useQuery(
		trpc.drivers.getMyCurrentShift.queryOptions()
	);

	const { data: prefData } = useQuery(
		trpc.drivers.getMyServicePreference.queryOptions()
	);
	const servicePreference = prefData?.preference;

	const toggleShiftMutation = useMutation(
		trpc.drivers.toggleShift.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries();
			},
		})
	);

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
			Alert.alert("Erreur de Service", err.message || "Impossible de modifier l'état de service.");
		}
	};

	const handleCallCarrier = (phone?: string | null) => {
		if (!phone) return;
		DriverFeedback.tap();
		Linking.openURL(`tel:${phone}`).catch(() => {
			Alert.alert("Erreur", "Impossible de composer le numéro.");
		});
	};

	const handleSignOut = async () => {
		DriverFeedback.tap();
		Alert.alert(
			"Déconnexion Chauffeur",
			"Êtes-vous sûr de vouloir vous déconnecter du terminal chauffeur ?",
			[
				{ text: "Annuler", style: "cancel" },
				{
					text: "Déconnexion",
					style: "destructive",
					onPress: async () => {
						try {
							await authClient.signOut();
						} catch {}
						router.replace("/(auth)/login");
					},
				},
			]
		);
	};

	const driverName = profile?.user?.fullName ?? "Chauffeur Moja";
	const initials = driverName
		.split(" ")
		.map((n: string) => n[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();

	return (
		<View style={styles.root}>
			{/* Top Passport Header */}
			<View style={[styles.headerBar, { paddingTop: insets.top + 12 }]}>
				<Text style={styles.headerTitle}>Passeport Carrière Conducteur</Text>
				<Text style={styles.headerSubtitle}>
					Identité professionnelle universelle inter-opérateurs Moja Ride
				</Text>
			</View>

			<ScrollView
				style={styles.scroll}
				contentContainerStyle={[
					styles.scrollContent,
					{ paddingBottom: Math.max(insets.bottom, 24) + 80 },
				]}
				showsVerticalScrollIndicator={false}
			>
				{/* Driver ID Card */}
				<Card className="p-5 gap-4">
					<View style={styles.idRow}>
						<View style={styles.avatarBox}>
							<Text style={styles.avatarText}>{initials}</Text>
						</View>
						<View style={styles.idInfo}>
							<Text style={styles.driverName} numberOfLines={1}>
								{driverName}
							</Text>
							<View style={styles.verifiedRow}>
								<HugeiconsIcon icon={SecurityCheckIcon} size={14} color="#10b981" />
								<Text style={styles.verifiedText}>
									{profile?.licenseCategory
										? `Classe ${profile.licenseCategory} Poids Lourd`
										: "Chauffeur Commercial Vérifié"}
								</Text>
							</View>
							<Text style={styles.licenseNumber}>
								Permis : {profile?.licenseNumber ?? "N/A"}
							</Text>
						</View>
					</View>

					{/* Shift On-Duty Toggle */}
					<View style={styles.toggleRow}>
						<View style={styles.toggleTextWrap}>
							<Text style={styles.toggleTitle}>État de Prise de Service</Text>
							<Text style={styles.toggleSub}>
								{isShiftActive
									? `En service (${elapsedMinutes} min actives)`
									: "Hors-service / En repos"}
							</Text>
						</View>
						{toggleShiftMutation.isPending ? (
							<ActivityIndicator size="small" color={colors.primary.rose} />
						) : (
							<Switch
								value={isShiftActive}
								onValueChange={handleToggleShift}
								trackColor={{ false: "#27272a", true: "#ee237c" }}
								thumbColor="#ffffff"
							/>
						)}
					</View>

					{/* Marketplace Availability Toggle */}
					<View style={styles.toggleRow}>
						<View style={styles.toggleTextWrap}>
							<View style={styles.toggleIconLabel}>
								<HugeiconsIcon icon={Briefcase01Icon} size={14} color="#a1a1aa" />
								<Text style={styles.toggleTitle}>Disponible pour Embauche</Text>
							</View>
							<Text style={styles.toggleSub}>
								{servicePreference?.isAvailableForHire
									? "Visible par les transporteurs sur la marketplace"
									: "Masqué de la marketplace transporteur"}
							</Text>
						</View>
						{setPreferenceMutation.isPending ? (
							<ActivityIndicator size="small" color={colors.primary.rose} />
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
										});
										DriverFeedback.successScan();
									} catch (err: any) {
										DriverFeedback.invalidScan();
										Alert.alert("Erreur", err.message || "Impossible de mettre à jour.");
									}
								}}
								trackColor={{ false: "#27272a", true: "#10b981" }}
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
						activeOpacity={0.8}
						style={styles.editProfileBtn}
					>
						<View style={styles.editProfileLeft}>
							<HugeiconsIcon icon={Edit02Icon} size={16} color="#38bdf8" />
							<View>
								<Text style={styles.editProfileTitle}>
									Modifier Profil Marketplace
								</Text>
								<Text style={styles.editProfileSub}>
									{servicePreference?.cityBase
										? `Base : ${servicePreference.cityBase} · ${servicePreference.routeExperience?.length ?? 0} lignes`
										: "Ville base, type d'activité, expérience lignes"}
								</Text>
							</View>
						</View>
						<HugeiconsIcon icon={Briefcase01Icon} size={16} color="#71717a" />
					</TouchableOpacity>

					{/* Language Selector Link */}
					<TouchableOpacity
						onPress={() => {
							DriverFeedback.tap();
							router.push("/language");
						}}
						activeOpacity={0.8}
						style={styles.editProfileBtn}
					>
						<View style={styles.editProfileLeft}>
							<HugeiconsIcon icon={Globe02Icon} size={16} color="#ee237c" />
							<View>
								<Text style={[styles.editProfileTitle, { color: "#ee237c" }]}>
									Langue d'Affichage / Language
								</Text>
								<Text style={styles.editProfileSub}>
									Français (Côte d'Ivoire) / English
								</Text>
							</View>
						</View>
						<Badge variant="outline" label="FR / EN" size="sm" />
					</TouchableOpacity>
				</Card>

				{/* Earnings Summary Card */}
				<Card className="p-5 gap-3">
					<View style={styles.cardHeaderRow}>
						<View style={styles.cardHeaderLeft}>
							<HugeiconsIcon icon={Coins01Icon} size={18} color="#f59e0b" />
							<Text style={styles.cardHeaderTitle}>Aperçu des Gains</Text>
						</View>
						<Text style={styles.currencyBadge}>XOF Monnaie</Text>
					</View>

					<View style={styles.earningsAmountRow}>
						<Text style={styles.earningsAmount}>
							{(earnings?.todayEarningsXof ?? 0).toLocaleString()}
						</Text>
						<Text style={styles.earningsSub}>XOF Aujourd'hui</Text>
					</View>

					<View style={styles.earningsMetaRow}>
						<View style={styles.earningsMetaLeft}>
							<HugeiconsIcon icon={Clock01Icon} size={13} color="#71717a" />
							<Text style={styles.earningsMetaText}>
								{currentShift ? `${elapsedMinutes} min de service` : "Service inactif"}
							</Text>
						</View>
						<Text style={styles.earningsWeekText}>
							Semaine : {(earnings?.weekEarningsXof ?? 0).toLocaleString()} XOF
						</Text>
					</View>
				</Card>

				{/* Telemetry Health */}
				<Card className="p-5 gap-3">
					<View style={styles.cardHeaderRow}>
						<View style={styles.cardHeaderLeft}>
							<HugeiconsIcon icon={Activity01Icon} size={18} color="#38bdf8" />
							<Text style={styles.cardHeaderTitle}>{t("telemetryHealth")}</Text>
						</View>
						<Badge
							variant={
								health.needsReauth
									? "error"
									: health.adaptiveMode === "OFFLINE"
										? "default"
										: "success"
							}
							label={
								health.adaptiveMode === "HIGH_RATE"
									? t("streaming")
									: health.adaptiveMode === "STATIONARY"
										? t("idleTracking")
										: t("offline")
							}
						/>
					</View>

					<View style={styles.earningsMetaRow}>
						<View style={styles.earningsMetaLeft}>
							<HugeiconsIcon icon={Clock01Icon} size={13} color="#71717a" />
							<Text style={styles.earningsMetaText}>
								{health.lastPingAt
									? t("pingAgo", {
											minutes: Math.max(
												0,
												Math.round(
													(Date.now() - new Date(health.lastPingAt).getTime()) / 60000
												),
											),
										})
									: t("noPingYet")}
							</Text>
						</View>
						<Text style={styles.earningsWeekText}>
							{t("queued", { count: health.queueLength })}
						</Text>
					</View>

					{health.needsReauth && (
						<View style={styles.reauthAlert}>
							<HugeiconsIcon icon={Alert02Icon} size={14} color="#fb7185" />
							<Text style={styles.reauthText}>{t("reauthHint")}</Text>
						</View>
					)}
				</Card>

				{/* Lifetime Career Achievements */}
				<View style={styles.metricsGrid}>
					<Card className="flex-1 min-w-[140px] p-4 gap-1">
						<View style={styles.metricHeader}>
							<HugeiconsIcon icon={StarIcon} size={18} color="#f59e0b" />
							<Text style={styles.metricLabel}>Note</Text>
						</View>
						<Text style={styles.metricValue}>
							{(earnings?.averageRating ?? 5.0).toFixed(2)}
						</Text>
						<Text style={styles.metricSub}>
							{profile?._count?.reviews ?? 0} avis passagers
						</Text>
					</Card>

					<Card className="flex-1 min-w-[140px] p-4 gap-1">
						<View style={styles.metricHeader}>
							<HugeiconsIcon icon={SecurityCheckIcon} size={18} color="#10b981" />
							<Text style={styles.metricLabel}>Sécurité</Text>
						</View>
						<Text style={[styles.metricValue, styles.metricSafety]}>
							{earnings?.safetyScore ?? profile?.safetyScore ?? 98}/100
						</Text>
						<Text style={styles.metricSub}>Zéro incident noté</Text>
					</Card>

					<Card className="flex-1 min-w-[140px] p-4 gap-1">
						<View style={styles.metricHeader}>
							<HugeiconsIcon icon={Route01Icon} size={18} color="#38bdf8" />
							<Text style={styles.metricLabel}>Trajets</Text>
						</View>
						<Text style={styles.metricValue}>
							{profile?.totalTripsCompleted ?? earnings?.totalTripsCompleted ?? 0}
						</Text>
						<Text style={styles.metricSub}>Courses achevées</Text>
					</Card>

					<Card className="flex-1 min-w-[140px] p-4 gap-1">
						<View style={styles.metricHeader}>
							<HugeiconsIcon icon={Award01Icon} size={18} color="#a855f7" />
							<Text style={styles.metricLabel}>Distance</Text>
						</View>
						<Text style={styles.metricValue}>
							{Math.round(profile?.totalDistanceKm ?? earnings?.totalDistanceKm ?? 0).toLocaleString()}
						</Text>
						<Text style={styles.metricSub}>km enregistrés</Text>
					</Card>
				</View>

				{/* Affiliated Carriers */}
				<Card className="p-4 gap-3">
					<Text style={styles.sectionTitle}>
						Affiliations Transporteurs Actives
					</Text>

					{profile?.companyAffiliations && profile.companyAffiliations.length > 0 ? (
						profile.companyAffiliations.map((aff: any) => (
							<View key={aff.id} style={styles.carrierRow}>
								<View style={styles.carrierRowLeft}>
									<HugeiconsIcon icon={Building01Icon} size={18} color={colors.primary.rose} />
									<View style={styles.carrierInfoWrap}>
										<Text style={styles.carrierName} numberOfLines={1}>
											{aff.company?.name ?? "Transporteur Commercial"}
										</Text>
										<Text style={styles.carrierBadgeNumber}>
											Badge : {aff.companyBadgeNumber ?? aff.company?.slug ?? "Actif"}
										</Text>
									</View>
								</View>

								{aff.company?.phone && (
									<TouchableOpacity
										onPress={() => handleCallCarrier(aff.company.phone)}
										activeOpacity={0.8}
										style={styles.carrierCallBtn}
									>
										<HugeiconsIcon icon={Call02Icon} size={14} color="#38bdf8" />
									</TouchableOpacity>
								)}

								<Badge variant="success" label="Actif" size="sm" />
							</View>
						))
					) : (
						<View style={styles.carrierRow}>
							<View style={styles.carrierRowLeft}>
								<HugeiconsIcon icon={Building01Icon} size={18} color={colors.primary.rose} />
								<View>
									<Text style={styles.carrierName}>Transporteur Direct</Text>
									<Text style={styles.carrierBadgeNumber}>Contrat Chauffeur Agréé</Text>
								</View>
							</View>
							<Badge variant="outline" label="Indépendant" size="sm" />
						</View>
					)}
				</Card>

				{/* Sign Out Button */}
				<Button
					title="Déconnexion du Terminal"
					variant="outline"
					size="lg"
					onPress={handleSignOut}
					icon={<HugeiconsIcon icon={Logout01Icon} size={18} color="#ef4444" />}
					textClassName="text-[#ef4444]"
					className="border-[#ef4444]/30 mt-2"
				/>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: "#09090b",
	},
	headerBar: {
		paddingHorizontal: 20,
		paddingBottom: 14,
		borderBottomWidth: 1,
		borderBottomColor: "#27272a",
		backgroundColor: "#09090b",
	},
	headerTitle: {
		fontSize: 20,
		fontWeight: "800",
		color: "#fafafa",
		letterSpacing: -0.3,
	},
	headerSubtitle: {
		fontSize: 11,
		color: "#a1a1aa",
		marginTop: 2,
	},
	scroll: {
		flex: 1,
	},
	scrollContent: {
		paddingHorizontal: 16,
		paddingTop: 16,
		gap: 16,
	},
	idRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
	},
	avatarBox: {
		width: 56,
		height: 56,
		borderRadius: 18,
		backgroundColor: "rgba(238, 35, 124, 0.1)",
		borderWidth: 1,
		borderColor: "rgba(238, 35, 124, 0.2)",
		alignItems: "center",
		justifyContent: "center",
	},
	avatarText: {
		fontSize: 20,
		fontWeight: "800",
		color: "#ee237c",
	},
	idInfo: {
		flex: 1,
	},
	driverName: {
		fontSize: 18,
		fontWeight: "800",
		color: "#fafafa",
	},
	verifiedRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		marginTop: 2,
	},
	verifiedText: {
		fontSize: 12,
		fontWeight: "600",
		color: "#34d399",
	},
	licenseNumber: {
		fontSize: 11,
		color: "#71717a",
		fontFamily: "monospace",
		marginTop: 2,
	},
	toggleRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		backgroundColor: "#09090b",
		padding: 14,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "#27272a",
	},
	toggleTextWrap: {
		flex: 1,
		paddingRight: 12,
	},
	toggleIconLabel: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	toggleTitle: {
		fontSize: 14,
		fontWeight: "700",
		color: "#fafafa",
	},
	toggleSub: {
		fontSize: 11,
		color: "#a1a1aa",
		marginTop: 2,
	},
	editProfileBtn: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		backgroundColor: "#09090b",
		padding: 14,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "#27272a",
	},
	editProfileLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		flex: 1,
	},
	editProfileTitle: {
		fontSize: 14,
		fontWeight: "700",
		color: "#38bdf8",
	},
	editProfileSub: {
		fontSize: 11,
		color: "#71717a",
		marginTop: 2,
	},
	cardHeaderRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	cardHeaderLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	cardHeaderTitle: {
		fontSize: 11,
		fontWeight: "700",
		color: "#a1a1aa",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	currencyBadge: {
		fontSize: 11,
		fontFamily: "monospace",
		fontWeight: "700",
		color: "#34d399",
	},
	earningsAmountRow: {
		flexDirection: "row",
		alignItems: "baseline",
		gap: 8,
		paddingTop: 4,
	},
	earningsAmount: {
		fontSize: 28,
		fontWeight: "800",
		color: "#fafafa",
		fontFamily: "monospace",
	},
	earningsSub: {
		fontSize: 12,
		fontWeight: "700",
		color: "#a1a1aa",
	},
	earningsMetaRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		backgroundColor: "#09090b",
		padding: 12,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#27272a",
	},
	earningsMetaLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	earningsMetaText: {
		fontSize: 12,
		color: "#d4d4d8",
	},
	earningsWeekText: {
		fontSize: 12,
		color: "#a1a1aa",
		fontWeight: "600",
	},
	reauthAlert: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		backgroundColor: "rgba(239, 68, 68, 0.1)",
		borderWidth: 1,
		borderColor: "rgba(239, 68, 68, 0.3)",
		padding: 12,
		borderRadius: 12,
	},
	reauthText: {
		fontSize: 12,
		color: "#fb7185",
		flex: 1,
	},
	metricsGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 12,
	},
	metricHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: 4,
	},
	metricLabel: {
		fontSize: 12,
		color: "#a1a1aa",
		fontWeight: "700",
	},
	metricValue: {
		fontSize: 24,
		fontWeight: "800",
		color: "#fafafa",
		fontFamily: "monospace",
	},
	metricSafety: {
		color: "#34d399",
	},
	metricSub: {
		fontSize: 11,
		color: "#71717a",
	},
	sectionTitle: {
		fontSize: 11,
		fontWeight: "700",
		color: "#a1a1aa",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	carrierRow: {
		backgroundColor: "#09090b",
		padding: 12,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "#27272a",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	carrierRowLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		flex: 1,
		marginRight: 8,
	},
	carrierInfoWrap: {
		flex: 1,
	},
	carrierName: {
		fontSize: 14,
		fontWeight: "700",
		color: "#fafafa",
	},
	carrierBadgeNumber: {
		fontSize: 11,
		color: "#a1a1aa",
		fontFamily: "monospace",
	},
	carrierCallBtn: {
		width: 32,
		height: 32,
		borderRadius: 10,
		backgroundColor: "#18181b",
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "#27272a",
		marginRight: 8,
	},
});
