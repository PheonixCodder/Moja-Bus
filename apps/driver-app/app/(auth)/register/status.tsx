import { useEffect } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	ActivityIndicator,
	RefreshControl,
	Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
	Time02Icon,
	CheckmarkCircle02Icon,
	CancelCircleIcon,
	Alert02Icon,
	Call02Icon,
	ArrowRight01Icon,
	RefreshIcon,
	Logout01Icon,
} from "@hugeicons/core-free-icons";
import { useTRPC } from "@/lib/trpc";
import { authClient } from "@/lib/auth-client";
import { useDriverRegistrationStore } from "@/stores/driver-registration";
import { DriverFeedback } from "@/lib/haptics";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { colors } from "@/constants/theme";

export default function RegisterStatusScreen() {
	const { t } = useTranslation("auth");
	const router = useRouter();
	const trpc = useTRPC();

	useEffect(() => {
		useDriverRegistrationStore.getState().reset();
	}, []);

	const {
		data: statusData,
		isLoading,
		isRefetching,
		refetch,
	} = useQuery(
		trpc.drivers.getMyVerificationStatus.queryOptions(undefined, {
			refetchInterval: 10000,
		})
	);

	const verificationStatus = statusData?.driver?.verificationStatus ?? "PENDING";
	const rejectionReason = statusData?.driver?.rejectionReason;

	const handleEnterDashboard = () => {
		DriverFeedback.successScan();
		router.replace("/(tabs)/trips");
	};

	const handleContactSupport = () => {
		DriverFeedback.tap();
		Linking.openURL("tel:+2250700000000").catch(() => {});
	};

	const handleSignOut = async () => {
		DriverFeedback.tap();
		try {
			await authClient.signOut();
		} catch {}
		router.replace("/(auth)/login");
	};

	return (
		<ScreenShell
			header={
				<PageHeader
					title={t("statusTitle")}
					subtitle={t("statusSubtitle")}
					showBack={false}
				/>
			}
		>
			<View className="gap-6 py-3">
				{isLoading ? (
					<View className="items-center justify-center py-12 gap-3">
						<ActivityIndicator size="large" color={colors.primary.rose} />
						<Text className="text-xs text-muted-foreground font-medium">
							{t("statusLoading")}
						</Text>
					</View>
				) : verificationStatus === "VERIFIED" ? (
					/* VERIFIED STATE */
					<View className="items-center gap-5">
						<View className="w-20 h-20 rounded-3xl items-center justify-center bg-success/15 border-2 border-success/30">
							<HugeiconsIcon icon={CheckmarkCircle02Icon} size={40} color={colors.semantic.success} />
						</View>

						<View className="items-center gap-1.5">
							<Text className="text-2xl font-extrabold text-foreground text-center tracking-tight">{t("statusVerifiedTitle")}</Text>
							<Text className="text-xs font-bold text-success text-center">{t("statusVerifiedSub")}</Text>
							<Text className="text-xs text-muted-foreground text-center leading-5 mt-1">
								{t("statusVerifiedDesc")}
							</Text>
						</View>

						<Button
							title={t("enterDispatches")}
							variant="success"
							size="lg"
							onPress={handleEnterDashboard}
							icon={<HugeiconsIcon icon={ArrowRight01Icon} size={20} color={colors.neutral.textPrimary} />}
							iconPosition="right"
						/>
					</View>
				) : verificationStatus === "SUSPENDED" ? (
					/* SUSPENDED STATE */
					<View className="items-center gap-5">
						<View className="w-20 h-20 rounded-3xl items-center justify-center bg-destructive/15 border-2 border-destructive/30">
							<HugeiconsIcon icon={Alert02Icon} size={40} color={colors.semantic.error} />
						</View>

						<View className="items-center gap-1.5">
							<Text className="text-2xl font-extrabold text-foreground text-center tracking-tight">{t("statusSuspendedTitle")}</Text>
							<Text className="text-xs font-bold text-destructive text-center">{t("statusSuspendedSub")}</Text>
							<Text className="text-xs text-muted-foreground text-center leading-5 mt-1">
								{t("statusSuspendedDesc")}
							</Text>
						</View>

						<Button
							title={t("contactSecurity")}
							variant="secondary"
							size="lg"
							onPress={handleContactSupport}
							icon={<HugeiconsIcon icon={Call02Icon} size={20} color={colors.neutral.textPrimary} />}
						/>

						<Button
							title={t("signOutBtn")}
							variant="outline"
							size="md"
							onPress={handleSignOut}
							icon={<HugeiconsIcon icon={Logout01Icon} size={18} color={colors.neutral.textSecondary} />}
						/>
					</View>
				) : verificationStatus === "REJECTED" ? (
					/* REJECTED STATE */
					<View className="items-center gap-5">
						<View className="w-20 h-20 rounded-3xl items-center justify-center bg-destructive/15 border-2 border-destructive/30">
							<HugeiconsIcon icon={CancelCircleIcon} size={40} color={colors.semantic.error} />
						</View>

						<View className="items-center gap-1.5">
							<Text className="text-2xl font-extrabold text-foreground text-center tracking-tight">{t("statusRejectedTitle")}</Text>
							<Text className="text-xs font-bold text-destructive text-center">{t("statusRejectedSub")}</Text>
						</View>

						{rejectionReason && (
							<Card className="w-full gap-1 border-destructive/30">
								<Text className="text-xs font-bold text-muted-foreground">
									{t("rejectionHeader")}
								</Text>
								<Text className="text-xs text-destructive leading-5">
									{rejectionReason}
								</Text>
							</Card>
						)}

						<Button
							title={t("updateAndResubmit")}
							variant="primary"
							size="lg"
							onPress={() => router.replace("/(auth)/register")}
						/>
					</View>
				) : (
					/* PENDING STATE */
					<View className="items-center gap-5">
						<View className="w-20 h-20 rounded-3xl items-center justify-center bg-warning/15 border-2 border-warning/30">
							<HugeiconsIcon icon={Time02Icon} size={40} color={colors.semantic.warning} />
						</View>

						<View className="items-center gap-1.5">
							<Text className="text-2xl font-extrabold text-foreground text-center tracking-tight">{t("statusPendingTitle")}</Text>
							<Text className="text-xs font-bold text-warning text-center">{t("statusPendingSub")}</Text>
							<Text className="text-xs text-muted-foreground text-center leading-5 max-w-[320px] mt-1">
								{t("statusPendingDesc")}
							</Text>
						</View>

						<Card className="w-full gap-2.5">
							<View className="flex-row items-center justify-between">
								<Text className="text-xs text-muted-foreground">{t("applicationRef")}</Text>
								<Text className="text-xs font-mono font-bold text-foreground">
									{statusData?.driver?.id?.slice(0, 12) ?? "EN_COURS"}
								</Text>
							</View>
							<View className="flex-row items-center justify-between">
								<Text className="text-xs text-muted-foreground">{t("licenseCategory")}</Text>
								<Text className="text-xs font-bold text-primary">
									{t("licenseClassPrefix", { category: statusData?.driver?.licenseCategory ?? "D" })}
								</Text>
							</View>
						</Card>

						<View className="w-full gap-2.5 pt-2">
							<Button
								title={t("refreshStatus")}
								variant="secondary"
								size="md"
								onPress={() => refetch()}
								icon={<HugeiconsIcon icon={RefreshIcon} size={18} color={colors.neutral.textPrimary} />}
							/>

							<Button
								title={t("contactDispatch")}
								variant="outline"
								size="md"
								onPress={handleContactSupport}
								icon={<HugeiconsIcon icon={Call02Icon} size={20} color={colors.primary.blue} />}
							/>
						</View>
					</View>
				)}

				<Button
					title={t("changeAccount")}
					variant="ghost"
					size="sm"
					onPress={handleSignOut}
					icon={<HugeiconsIcon icon={Logout01Icon} size={14} color={colors.neutral.textMuted} />}
					className="h-auto py-3 bg-transparent border-transparent"
					textClassName="text-xs text-muted-foreground font-semibold"
				/>
			</View>
		</ScreenShell>
	);
}
