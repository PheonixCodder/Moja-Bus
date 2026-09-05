import React, { useEffect, useState } from "react";
import {
	View,
	Text,
	ScrollView,
	Switch,
	ActivityIndicator,
	Alert,
	Linking,
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
import { UserAvatar } from "@/components/ui/avatar";
import { colors, Palette } from "@/constants/theme";

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
			Alert.alert(t("errors.shiftToggle"), err.message || t("errors.shiftToggleMsg"));
		}
	};

	const handleCallCarrier = (phone?: string | null) => {
		if (!phone) return;
		DriverFeedback.tap();
		Linking.openURL(`tel:${phone}`).catch(() => {
			Alert.alert(t("errors.call"), t("errors.callMsg"));
		});
	};

	const handleSignOut = async () => {
		DriverFeedback.tap();
		Alert.alert(
			t("signOut.title"),
			t("signOut.body"),
			[
				{ text: t("signOut.cancel"), style: "cancel" },
				{
					text: t("signOut.confirm"),
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

	const driverName = profile?.user?.fullName ?? t("fallbackName");

	return (
		<View className="flex-1 bg-background">
			{/* Top Passport Header */}
			<View
				className="px-5 pb-3.5 border-b border-border bg-background"
				style={{ paddingTop: insets.top + 12 }}
			>
				<Text className="text-xl font-extrabold text-foreground tracking-tight">{t("headerTitle")}</Text>
				<Text className="text-xs text-muted-foreground mt-0.5">
					{t("headerSubtitle")}
				</Text>
			</View>

			<ScrollView
				className="flex-1"
				contentContainerStyle={{
					paddingHorizontal: 16,
					paddingTop: 16,
					paddingBottom: Math.max(insets.bottom, 24) + 80,
				}}
				showsVerticalScrollIndicator={false}
			>
				<View className="gap-4">
					{/* Driver ID Card */}
					<Card className="p-5 gap-4">
						<View className="flex-row items-center gap-3.5">
							<UserAvatar
								name={driverName}
								src={profile?.user?.image}
								seed={profile?.user?.id || driverName}
								size="xl"
								className="w-14 h-14 rounded-2xl"
							/>
							<View className="flex-1">
								<Text className="text-lg font-extrabold text-foreground" numberOfLines={1}>
									{driverName}
								</Text>
								<View className="flex-row items-center gap-1.5 mt-0.5">
									<HugeiconsIcon icon={SecurityCheckIcon} size={14} color={colors.semantic.success} />
									<Text className="text-xs font-semibold text-emerald-400">
										{profile?.licenseCategory
											? t("licenseClass", { category: profile.licenseCategory })
											: t("verifiedBadge")}
									</Text>
								</View>
								<Text className="text-xs text-muted-foreground font-mono mt-0.5">
									{t("licenseLabel", { number: profile?.licenseNumber ?? t("licenseNA") })}
								</Text>
							</View>
						</View>

						{/* Shift On-Duty Toggle */}
						<View className="flex-row items-center justify-between bg-background p-3.5 rounded-2xl border border-border">
							<View className="flex-1 pr-3">
								<Text className="text-sm font-bold text-foreground">{t("shift.title")}</Text>
								<Text className="text-xs text-muted-foreground mt-0.5">
									{isShiftActive
										? t("shift.active", { minutes: elapsedMinutes })
										: t("shift.inactive")}
								</Text>
							</View>
							{toggleShiftMutation.isPending ? (
								<ActivityIndicator size="small" color={colors.primary.rose} />
							) : (
								<Switch
									value={isShiftActive}
									onValueChange={handleToggleShift}
									trackColor={{ false: colors.neutral.border, true: colors.primary.rose }}
									thumbColor={Palette.zinc[50]}
								/>
							)}
						</View>

						{/* Marketplace Availability Toggle */}
						<View className="flex-row items-center justify-between bg-background p-3.5 rounded-2xl border border-border">
							<View className="flex-1 pr-3">
								<View className="flex-row items-center gap-1.5">
									<HugeiconsIcon icon={Briefcase01Icon} size={14} color={colors.neutral.textSecondary} />
									<Text className="text-sm font-bold text-foreground">{t("marketplace.title")}</Text>
								</View>
								<Text className="text-xs text-muted-foreground mt-0.5">
									{servicePreference?.isAvailableForHire
										? t("marketplace.visible")
										: t("marketplace.hidden")}
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
											Alert.alert(t("errors.preference"), err.message || t("errors.preferenceMsg"));
										}
									}}
									trackColor={{ false: colors.neutral.border, true: colors.semantic.success }}
									thumbColor={Palette.zinc[50]}
								/>
							)}
						</View>

						{/* Edit Marketplace Profile Link */}
						<Button
							variant="outline"
							onPress={() => {
								DriverFeedback.tap();
								router.push("/(auth)/preferences");
							}}
							className="justify-between px-3.5 py-3 h-auto min-h-[56px] rounded-2xl border-border bg-background"
						>
							<View className="flex-row items-center gap-2.5 flex-1">
								<HugeiconsIcon icon={Edit02Icon} size={16} color={colors.semantic.info} />
								<View className="flex-1">
									<Text className="text-sm font-bold text-primary">
										{t("editProfile.title")}
									</Text>
									<Text className="text-xs text-muted-foreground mt-0.5">
										{servicePreference?.cityBase
											? t("editProfile.base", { city: servicePreference.cityBase, count: servicePreference.routeExperience?.length ?? 0 })
											: t("editProfile.subtitle")}
									</Text>
								</View>
							</View>
							<HugeiconsIcon icon={Briefcase01Icon} size={16} color={colors.neutral.textMuted} />
						</Button>

						{/* Language Selector Link */}
						<Button
							variant="outline"
							onPress={() => {
								DriverFeedback.tap();
								router.push("/language");
							}}
							className="justify-between px-3.5 py-3 h-auto min-h-[56px] rounded-2xl border-border bg-background"
						>
							<View className="flex-row items-center gap-2.5 flex-1">
								<HugeiconsIcon icon={Globe02Icon} size={16} color={colors.primary.rose} />
								<View className="flex-1">
									<Text className="text-sm font-bold text-primary">
										{t("language.title")}
									</Text>
									<Text className="text-xs text-muted-foreground mt-0.5">
										{t("language.subtitle")}
									</Text>
								</View>
							</View>
							<Badge variant="outline" label={t("language.badge")} size="sm" />
						</Button>
					</Card>

					{/* Earnings Summary Card */}
					<Card className="p-5 gap-3">
						<View className="flex-row items-center justify-between">
							<View className="flex-row items-center gap-2">
								<HugeiconsIcon icon={Coins01Icon} size={18} color={colors.semantic.warning} />
								<Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("earnings.title")}</Text>
							</View>
							<Text className="text-xs font-mono font-bold text-emerald-400">{t("earnings.currency")}</Text>
						</View>

						<View className="flex-row items-baseline gap-2 pt-1">
							<Text className="text-3xl font-extrabold text-foreground font-mono">
								{(earnings?.todayEarningsXof ?? 0).toLocaleString()}
							</Text>
							<Text className="text-xs font-bold text-muted-foreground">{t("earnings.today")}</Text>
						</View>

						<View className="flex-row items-center justify-between bg-background p-3 rounded-xl border border-border">
							<View className="flex-row items-center gap-1.5">
								<HugeiconsIcon icon={Clock01Icon} size={13} color={colors.neutral.textMuted} />
								<Text className="text-xs text-muted-foreground">
									{currentShift ? t("earnings.serviceActive", { minutes: elapsedMinutes }) : t("earnings.serviceInactive")}
								</Text>
							</View>
							<Text className="text-xs text-muted-foreground font-semibold">
								{t("earnings.week", { amount: (earnings?.weekEarningsXof ?? 0).toLocaleString() })}
							</Text>
						</View>
					</Card>

					{/* Telemetry Health */}
					<Card className="p-5 gap-3">
						<View className="flex-row items-center justify-between">
							<View className="flex-row items-center gap-2">
								<HugeiconsIcon icon={Activity01Icon} size={18} color={colors.semantic.info} />
								<Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("telemetryHealth")}</Text>
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

						<View className="flex-row items-center justify-between bg-background p-3 rounded-xl border border-border">
							<View className="flex-row items-center gap-1.5">
								<HugeiconsIcon icon={Clock01Icon} size={13} color={colors.neutral.textMuted} />
								<Text className="text-xs text-muted-foreground">
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
							<Text className="text-xs text-muted-foreground font-semibold">
								{t("queued", { count: health.queueLength })}
							</Text>
						</View>

						{health.needsReauth && (
							<View className="flex-row items-center gap-2 bg-destructive/10 border border-destructive/30 p-3 rounded-xl">
								<HugeiconsIcon icon={Alert02Icon} size={14} color={colors.semantic.error} />
								<Text className="text-xs text-destructive flex-1">{t("reauthHint")}</Text>
							</View>
						)}
					</Card>

					{/* Lifetime Career Achievements */}
					<View className="flex-row flex-wrap gap-3">
						<Card className="flex-1 min-w-36 p-4 gap-1">
							<View className="flex-row items-center gap-2 mb-1">
								<HugeiconsIcon icon={StarIcon} size={18} color={colors.semantic.warning} />
								<Text className="text-xs text-muted-foreground font-bold">{t("metric.rating")}</Text>
							</View>
							<Text className="text-2xl font-extrabold text-foreground font-mono">
								{(earnings?.averageRating ?? 5.0).toFixed(2)}
							</Text>
							<Text className="text-xs text-muted-foreground">
								{t("metric.reviews", { count: profile?._count?.reviews ?? 0 })}
							</Text>
						</Card>

						<Card className="flex-1 min-w-36 p-4 gap-1">
							<View className="flex-row items-center gap-2 mb-1">
								<HugeiconsIcon icon={SecurityCheckIcon} size={18} color={colors.semantic.success} />
								<Text className="text-xs text-muted-foreground font-bold">{t("metric.safety")}</Text>
							</View>
							<Text className="text-2xl font-extrabold font-mono text-emerald-400">
								{earnings?.safetyScore ?? profile?.safetyScore ?? 98}/100
							</Text>
							<Text className="text-xs text-muted-foreground">{t("metric.safetySub")}</Text>
						</Card>

						<Card className="flex-1 min-w-36 p-4 gap-1">
							<View className="flex-row items-center gap-2 mb-1">
								<HugeiconsIcon icon={Route01Icon} size={18} color={colors.semantic.info} />
								<Text className="text-xs text-muted-foreground font-bold">{t("metric.trips")}</Text>
							</View>
							<Text className="text-2xl font-extrabold text-foreground font-mono">
								{profile?.totalTripsCompleted ?? earnings?.totalTripsCompleted ?? 0}
							</Text>
							<Text className="text-xs text-muted-foreground">{t("metric.tripsSub")}</Text>
						</Card>

						<Card className="flex-1 min-w-36 p-4 gap-1">
							<View className="flex-row items-center gap-2 mb-1">
								<HugeiconsIcon icon={Award01Icon} size={18} color={colors.primary.rose} />
								<Text className="text-xs text-muted-foreground font-bold">{t("metric.distance")}</Text>
							</View>
							<Text className="text-2xl font-extrabold text-foreground font-mono">
								{Math.round(profile?.totalDistanceKm ?? earnings?.totalDistanceKm ?? 0).toLocaleString()}
							</Text>
							<Text className="text-xs text-muted-foreground">{t("metric.distanceSub")}</Text>
						</Card>
					</View>

					{/* Affiliated Carriers */}
					<Card className="p-4 gap-3">
						<Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
							{t("carriers.title")}
						</Text>

						{profile?.companyAffiliations && profile.companyAffiliations.length > 0 ? (
							profile.companyAffiliations.map((aff: any) => (
								<View key={aff.id} className="bg-background p-3 rounded-2xl border border-border flex-row items-center justify-between">
									<View className="flex-row items-center gap-3 flex-1 mr-2">
										<HugeiconsIcon icon={Building01Icon} size={18} color={colors.primary.rose} />
										<View className="flex-1">
											<Text className="text-sm font-bold text-foreground" numberOfLines={1}>
												{aff.company?.name ?? t("carriers.fallback")}
											</Text>
											<Text className="text-xs text-muted-foreground font-mono">
												{t("carriers.badge", { number: aff.companyBadgeNumber ?? aff.company?.slug ?? t("carriers.active") })}
											</Text>
										</View>
									</View>

									{aff.company?.phone && (
										<Button
											variant="outline"
											size="sm"
											onPress={() => handleCallCarrier(aff.company.phone)}
											className="w-8 h-8 min-h-8 p-0 rounded-xl mr-2"
										>
											<HugeiconsIcon icon={Call02Icon} size={14} color={colors.semantic.info} />
										</Button>
									)}

									<Badge variant="success" label={t("carriers.active")} size="sm" />
								</View>
							))
						) : (
							<View className="bg-background p-3 rounded-2xl border border-border flex-row items-center justify-between">
								<View className="flex-row items-center gap-3 flex-1 mr-2">
									<HugeiconsIcon icon={Building01Icon} size={18} color={colors.primary.rose} />
									<View>
										<Text className="text-sm font-bold text-foreground">{t("carriers.direct")}</Text>
										<Text className="text-xs text-muted-foreground font-mono">{t("carriers.contract")}</Text>
									</View>
								</View>
								<Badge variant="outline" label={t("carriers.independent")} size="sm" />
							</View>
						)}
					</Card>

					{/* Sign Out Button */}
					<Button
						title={t("signOut.button")}
						variant="destructive"
						size="lg"
						onPress={handleSignOut}
						icon={<HugeiconsIcon icon={Logout01Icon} size={18} color={Palette.zinc[50]} />}
						className="mt-2"
					/>
				</View>
			</ScrollView>
		</View>
	);
}
