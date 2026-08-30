import { useEffect } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	ActivityIndicator,
	RefreshControl,
	Linking,
	StyleSheet,
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
			<View style={styles.container}>
				{isLoading ? (
					<View style={styles.loadingBox}>
						<ActivityIndicator size="large" color={colors.primary.rose} />
						<Text style={styles.loadingText}>
							{t("statusLoading")}
						</Text>
					</View>
				) : verificationStatus === "VERIFIED" ? (
					/* VERIFIED STATE */
					<View style={styles.statusBox}>
						<View style={[styles.iconCircle, styles.iconCircleSuccess]}>
							<HugeiconsIcon icon={CheckmarkCircle02Icon} size={40} color="#10b981" />
						</View>

						<View style={styles.titleGroup}>
							<Text style={styles.mainTitle}>{t("statusVerifiedTitle")}</Text>
							<Text style={styles.successSub}>{t("statusVerifiedSub")}</Text>
							<Text style={styles.descText}>
								{t("statusVerifiedDesc")}
							</Text>
						</View>

						<Button
							title={t("enterDispatches")}
							variant="success"
							size="lg"
							onPress={handleEnterDashboard}
							icon={<HugeiconsIcon icon={ArrowRight01Icon} size={20} color="#ffffff" />}
							iconPosition="right"
						/>
					</View>
				) : verificationStatus === "SUSPENDED" ? (
					/* SUSPENDED STATE */
					<View style={styles.statusBox}>
						<View style={[styles.iconCircle, styles.iconCircleError]}>
							<HugeiconsIcon icon={Alert02Icon} size={40} color="#ef4444" />
						</View>

						<View style={styles.titleGroup}>
							<Text style={styles.mainTitle}>{t("statusSuspendedTitle")}</Text>
							<Text style={styles.errorSub}>{t("statusSuspendedSub")}</Text>
							<Text style={styles.descText}>
								{t("statusSuspendedDesc")}
							</Text>
						</View>

						<Button
							title={t("contactSecurity")}
							variant="secondary"
							size="lg"
							onPress={handleContactSupport}
							icon={<HugeiconsIcon icon={Call02Icon} size={20} color="#ffffff" />}
						/>

						<Button
							title={t("signOutBtn")}
							variant="outline"
							size="md"
							onPress={handleSignOut}
							icon={<HugeiconsIcon icon={Logout01Icon} size={18} color="#a1a1aa" />}
						/>
					</View>
				) : verificationStatus === "REJECTED" ? (
					/* REJECTED STATE */
					<View style={styles.statusBox}>
						<View style={[styles.iconCircle, styles.iconCircleError]}>
							<HugeiconsIcon icon={CancelCircleIcon} size={40} color="#ef4444" />
						</View>

						<View style={styles.titleGroup}>
							<Text style={styles.mainTitle}>{t("statusRejectedTitle")}</Text>
							<Text style={styles.errorSub}>{t("statusRejectedSub")}</Text>
						</View>

						{rejectionReason && (
							<Card className="w-full gap-1 border-[#ef4444]/30">
								<Text style={styles.rejectionHeader}>
									{t("rejectionHeader")}
								</Text>
								<Text style={styles.rejectionBody}>
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
					<View style={styles.statusBox}>
						<View style={[styles.iconCircle, styles.iconCirclePending]}>
							<HugeiconsIcon icon={Time02Icon} size={40} color="#f59e0b" />
						</View>

						<View style={styles.titleGroup}>
							<Text style={styles.mainTitle}>{t("statusPendingTitle")}</Text>
							<Text style={styles.pendingSub}>{t("statusPendingSub")}</Text>
							<Text style={styles.descText}>
								{t("statusPendingDesc")}
							</Text>
						</View>

						<Card className="w-full gap-2.5">
							<View style={styles.rowBetween}>
								<Text style={styles.labelMuted}>{t("applicationRef")}</Text>
								<Text style={styles.valueMono}>
									{statusData?.driver?.id?.slice(0, 12) ?? "EN_COURS"}
								</Text>
							</View>
							<View style={styles.rowBetween}>
								<Text style={styles.labelMuted}>{t("licenseCategory")}</Text>
								<Text style={styles.valueBrand}>
									{t("licenseClassPrefix", { category: statusData?.driver?.licenseCategory ?? "D" })}
								</Text>
							</View>
						</Card>

						<View style={styles.actionsColumn}>
							<Button
								title={t("refreshStatus")}
								variant="secondary"
								size="md"
								onPress={() => refetch()}
								icon={<HugeiconsIcon icon={RefreshIcon} size={18} color="#fafafa" />}
							/>

							<Button
								title={t("contactDispatch")}
								variant="outline"
								size="md"
								onPress={handleContactSupport}
								icon={<HugeiconsIcon icon={Call02Icon} size={20} color="#60a5fa" />}
							/>
						</View>
					</View>
				)}

				<TouchableOpacity
					onPress={handleSignOut}
					activeOpacity={0.8}
					style={styles.signOutBtn}
				>
					<HugeiconsIcon icon={Logout01Icon} size={14} color="#71717a" />
					<Text style={styles.signOutText}>
						{t("changeAccount")}
					</Text>
				</TouchableOpacity>
			</View>
		</ScreenShell>
	);
}

const styles = StyleSheet.create({
	container: {
		gap: 24,
		paddingVertical: 12,
	},
	loadingBox: {
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 48,
		gap: 12,
	},
	loadingText: {
		fontSize: 12,
		color: "#a1a1aa",
		fontWeight: "500",
	},
	statusBox: {
		alignItems: "center",
		gap: 20,
	},
	iconCircle: {
		width: 80,
		height: 80,
		borderRadius: 28,
		alignItems: "center",
		justifyContent: "center",
	},
	iconCircleSuccess: {
		backgroundColor: "rgba(16, 185, 129, 0.15)",
		borderWidth: 2,
		borderColor: "rgba(16, 185, 129, 0.3)",
	},
	iconCircleError: {
		backgroundColor: "rgba(239, 68, 68, 0.15)",
		borderWidth: 2,
		borderColor: "rgba(239, 68, 68, 0.3)",
	},
	iconCirclePending: {
		backgroundColor: "rgba(245, 158, 11, 0.15)",
		borderWidth: 2,
		borderColor: "rgba(245, 158, 11, 0.3)",
	},
	titleGroup: {
		alignItems: "center",
		gap: 6,
	},
	mainTitle: {
		fontSize: 24,
		fontWeight: "800",
		color: "#fafafa",
		textAlign: "center",
		letterSpacing: -0.5,
	},
	successSub: {
		fontSize: 13,
		fontWeight: "700",
		color: "#34d399",
		textAlign: "center",
	},
	errorSub: {
		fontSize: 13,
		fontWeight: "700",
		color: "#f87171",
		textAlign: "center",
	},
	pendingSub: {
		fontSize: 13,
		fontWeight: "700",
		color: "#fbbf24",
		textAlign: "center",
	},
	descText: {
		fontSize: 12,
		color: "#a1a1aa",
		textAlign: "center",
		lineHeight: 18,
		maxWidth: 320,
		marginTop: 4,
	},
	rejectionHeader: {
		fontSize: 12,
		fontWeight: "700",
		color: "#d4d4d8",
	},
	rejectionBody: {
		fontSize: 12,
		color: "#f87171",
		lineHeight: 18,
	},
	rowBetween: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	labelMuted: {
		fontSize: 12,
		color: "#a1a1aa",
	},
	valueMono: {
		fontSize: 12,
		fontFamily: "monospace",
		fontWeight: "700",
		color: "#fafafa",
	},
	valueBrand: {
		fontSize: 12,
		fontWeight: "700",
		color: "#ee237c",
	},
	actionsColumn: {
		width: "100%",
		gap: 10,
		paddingTop: 8,
	},
	signOutBtn: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
		paddingVertical: 12,
	},
	signOutText: {
		fontSize: 12,
		color: "#71717a",
		fontWeight: "600",
	},
});
