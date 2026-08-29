import React from "react";
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	RefreshControl,
	Alert,
	StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
	Clock01Icon,
	Building01Icon,
	PlayIcon,
	StopIcon,
	Wallet01Icon,
	Calendar01Icon,
} from "@hugeicons/core-free-icons";
import { useTRPC } from "@/lib/trpc";
import { DriverFeedback } from "@/lib/haptics";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { colors } from "@/constants/theme";

export function EarningsView() {
	const { t } = useTranslation("earnings");
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const insets = useSafeAreaInsets();

	const {
		data: earnings,
		isLoading,
		isRefetching,
		refetch,
	} = useQuery(trpc.drivers.getMyEarnings.queryOptions());

	const { data: currentShift } = useQuery(
		trpc.drivers.getMyCurrentShift.queryOptions()
	);

	const toggleShiftMutation = useMutation(
		trpc.drivers.toggleShift.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries();
			},
		})
	);

	const isShiftActive = !!currentShift;
	const elapsedMinutes = currentShift
		? Math.max(0, Math.round((Date.now() - new Date(currentShift.startedAt).getTime()) / 60000))
		: 0;

	const handleToggleShift = async () => {
		DriverFeedback.tap();
		try {
			await toggleShiftMutation.mutateAsync({
				onDuty: !isShiftActive,
			});
			DriverFeedback.successScan();
		} catch (err: any) {
			DriverFeedback.invalidScan();
			Alert.alert("Erreur de Service", err.message || "Impossible de modifier l'état de service.");
		}
	};

	const handleRequestPayout = () => {
		DriverFeedback.tap();
		Alert.alert(
			"Versement Mobile Money",
			"Votre transporteur transfère automatiquement vos gains accumulés sur votre portefeuille Mobile Money vérifié (Orange / MTN / Wave) chaque lundi à 08h00 GMT.",
			[{ text: "Compris", style: "default" }]
		);
	};

	const todayEarnings = earnings?.todayEarningsXof ?? 0;
	const weekEarnings = earnings?.weekEarningsXof ?? 0;
	const totalTrips = earnings?.totalTripsCompleted ?? 0;
	const recentShifts = earnings?.recentShifts ?? [];

	return (
		<View style={styles.root}>
			{/* Top Header */}
			<View style={[styles.headerBar, { paddingTop: insets.top + 12 }]}>
				<View style={styles.headerTitleWrap}>
					<Text style={styles.headerTitle}>{t("headerTitle")}</Text>
					<Text style={styles.headerSubtitle}>{t("headerSubtitle")}</Text>
				</View>
				<TouchableOpacity
					onPress={handleRequestPayout}
					activeOpacity={0.8}
					style={styles.walletBtn}
				>
					<HugeiconsIcon icon={Wallet01Icon} size={18} color="#10b981" />
				</TouchableOpacity>
			</View>

			<ScrollView
				style={styles.scroll}
				contentContainerStyle={[
					styles.scrollContent,
					{ paddingBottom: Math.max(insets.bottom, 24) + 80 },
				]}
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={isRefetching}
						onRefresh={() => refetch()}
						tintColor={colors.primary.rose}
					/>
				}
			>
				{/* Hero Earnings Card */}
				<Card className="p-6 gap-4 relative overflow-hidden bg-gradient-to-b from-[#18181b] to-[#121215]">
					<View style={styles.heroTopRow}>
						<Text style={styles.heroLabel}>{t("thisWeek")}</Text>
						<Badge
							variant="warning"
							label={t("estimationBadge") || "Estimation"}
						/>
					</View>

					<View style={styles.heroAmountRow}>
						<Text style={styles.heroAmount}>
							{weekEarnings.toLocaleString()}
						</Text>
						<Text style={styles.heroCurrency}>XOF</Text>
					</View>

					{/* Breakdown Grid */}
					<View style={styles.breakdownGrid}>
						<View style={styles.breakdownCol}>
							<Text style={styles.breakdownLabel}>{t("todayLabel")}</Text>
							<Text style={styles.breakdownValue}>
								{todayEarnings.toLocaleString()} XOF
							</Text>
						</View>
						<View style={styles.breakdownDivider} />
						<View style={styles.breakdownCol}>
							<Text style={styles.breakdownLabel}>{t("tripsCompletedLabel")}</Text>
							<Text style={[styles.breakdownValue, styles.breakdownSuccess]}>
								{totalTrips} {t("tripsCompleted")}
							</Text>
						</View>
					</View>
				</Card>

				{/* Live Shift Control Card */}
				<Card className="p-4 flex-row items-center justify-between">
					<View style={styles.shiftLeft}>
						<View
							style={[
								styles.shiftIconBox,
								isShiftActive ? styles.shiftIconActive : styles.shiftIconInactive,
							]}
						>
							<HugeiconsIcon
								icon={Clock01Icon}
								size={20}
								color={isShiftActive ? "#10b981" : "#71717a"}
							/>
						</View>
						<View>
							<Text style={styles.shiftStatusTitle}>
								{isShiftActive ? t("shiftOnDuty") : t("shiftOffDuty")}
							</Text>
							<Text style={styles.shiftStatusSub}>
								{isShiftActive ? `Pointé • ${elapsedMinutes} min écoulées` : "Prêt à pointer"}
							</Text>
						</View>
					</View>

					<Button
						title={isShiftActive ? t("shiftEndBtn") : t("shiftStartBtn")}
						variant={isShiftActive ? "outline" : "primary"}
						size="sm"
						loading={toggleShiftMutation.isPending}
						onPress={handleToggleShift}
						icon={
							<HugeiconsIcon
								icon={isShiftActive ? StopIcon : PlayIcon}
								size={14}
								color={isShiftActive ? "#f43f5e" : "#ffffff"}
							/>
						}
						textClassName={isShiftActive ? "text-[#f43f5e]" : undefined}
					/>
				</Card>

				{/* Carrier Compensation Breakdown */}
				{earnings?.byCompany && earnings.byCompany.length > 0 && (
					<View style={styles.sectionWrap}>
						<Text style={styles.sectionHeader}>{t("carrierBreakdown")}</Text>
						{earnings.byCompany.map((comp: any) => (
							<Card key={comp.companyId} className="p-4 gap-2">
								<View style={styles.companyRow}>
									<View style={styles.companyLeft}>
										<View style={styles.companyIconBox}>
											<HugeiconsIcon icon={Building01Icon} size={16} color={colors.primary.rose} />
										</View>
										<View>
											<Text style={styles.companyName}>{comp.companyName}</Text>
											<Text style={styles.companyType}>
												{comp.employmentType?.replace("_", " ")} • {comp.rateDescription}
											</Text>
										</View>
									</View>
									<View style={styles.companyRight}>
										<Text style={styles.companyAmount}>
											{comp.weekEarningsXof.toLocaleString()} XOF
										</Text>
										<Text style={styles.companyMinutes}>
											{comp.weekMinutes} min cette semaine
										</Text>
									</View>
								</View>
							</Card>
						))}
					</View>
				)}

				{/* Shift Ledger History */}
				<View style={styles.sectionWrap}>
					<Text style={styles.sectionHeader}>{t("recentShifts")}</Text>

					{recentShifts.length === 0 ? (
						<Card className="p-6 items-center justify-center text-center gap-1.5">
							<HugeiconsIcon icon={Clock01Icon} size={32} color="#71717a" />
							<Text style={styles.emptyLedgerTitle}>{t("emptyLedger")}</Text>
							<Text style={styles.emptyLedgerSubtitle}>{t("emptyLedgerDesc")}</Text>
						</Card>
					) : (
						recentShifts.map((shift: any) => {
							const start = new Date(shift.startedAt);
							const durationMins = shift.endedAt
								? Math.round((new Date(shift.endedAt).getTime() - start.getTime()) / 60000)
								: null;

							return (
								<Card key={shift.id} className="p-4 gap-2">
									<View style={styles.shiftRow}>
										<View style={styles.shiftRowLeft}>
											<HugeiconsIcon icon={Calendar01Icon} size={16} color="#a1a1aa" />
											<View>
												<Text style={styles.shiftDateText}>
													{start.toLocaleDateString([], {
														weekday: "short",
														day: "numeric",
														month: "short",
													})}
												</Text>
												<Text style={styles.shiftHourText}>
													{start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
													{shift.endedAt
														? ` → ${new Date(shift.endedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
														: " (En cours)"}
												</Text>
											</View>
										</View>

										<Badge
											variant={shift.status === "COMPLETED" ? "default" : "warning"}
											label={
												shift.status === "COMPLETED"
													? `${durationMins ?? 0} min`
													: "En Cours"
											}
										/>
									</View>
								</Card>
							);
						})
					)}
				</View>
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
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	headerTitleWrap: {
		gap: 2,
		flex: 1,
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
	},
	walletBtn: {
		width: 40,
		height: 40,
		borderRadius: 14,
		backgroundColor: "#18181b",
		borderWidth: 1,
		borderColor: "#27272a",
		alignItems: "center",
		justifyContent: "center",
	},
	scroll: {
		flex: 1,
	},
	scrollContent: {
		paddingHorizontal: 16,
		paddingTop: 16,
		gap: 16,
	},
	heroTopRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	heroLabel: {
		fontSize: 11,
		fontWeight: "700",
		textTransform: "uppercase",
		color: "#a1a1aa",
		letterSpacing: 0.5,
	},
	heroAmountRow: {
		flexDirection: "row",
		alignItems: "baseline",
		gap: 8,
	},
	heroAmount: {
		fontSize: 36,
		fontWeight: "800",
		color: "#fafafa",
		fontFamily: "monospace",
		letterSpacing: -1,
	},
	heroCurrency: {
		fontSize: 14,
		fontWeight: "700",
		color: "#ee237c",
	},
	breakdownGrid: {
		flexDirection: "row",
		alignItems: "center",
		gap: 16,
		paddingTop: 16,
		borderTopWidth: 1,
		borderTopColor: "#27272a",
	},
	breakdownCol: {
		flex: 1,
		gap: 2,
	},
	breakdownLabel: {
		fontSize: 10,
		textTransform: "uppercase",
		color: "#71717a",
		fontWeight: "700",
	},
	breakdownValue: {
		fontSize: 15,
		fontWeight: "700",
		color: "#fafafa",
		fontFamily: "monospace",
	},
	breakdownSuccess: {
		color: "#34d399",
	},
	breakdownDivider: {
		width: 1,
		height: 32,
		backgroundColor: "#27272a",
	},
	shiftLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	shiftIconBox: {
		width: 44,
		height: 44,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
	},
	shiftIconActive: {
		backgroundColor: "rgba(16, 185, 129, 0.15)",
		borderColor: "rgba(16, 185, 129, 0.3)",
	},
	shiftIconInactive: {
		backgroundColor: "#09090b",
		borderColor: "#27272a",
	},
	shiftStatusTitle: {
		fontSize: 14,
		fontWeight: "700",
		color: "#fafafa",
	},
	shiftStatusSub: {
		fontSize: 11,
		color: "#a1a1aa",
	},
	sectionWrap: {
		gap: 12,
		paddingTop: 6,
	},
	sectionHeader: {
		fontSize: 11,
		fontWeight: "700",
		color: "#a1a1aa",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	companyRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	companyLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	companyIconBox: {
		width: 32,
		height: 32,
		borderRadius: 10,
		backgroundColor: "#09090b",
		borderWidth: 1,
		borderColor: "#27272a",
		alignItems: "center",
		justifyContent: "center",
	},
	companyName: {
		fontSize: 14,
		fontWeight: "700",
		color: "#fafafa",
	},
	companyType: {
		fontSize: 11,
		color: "#a1a1aa",
	},
	companyRight: {
		alignItems: "flex-end",
	},
	companyAmount: {
		fontSize: 13,
		fontWeight: "700",
		fontFamily: "monospace",
		color: "#34d399",
	},
	companyMinutes: {
		fontSize: 10,
		color: "#71717a",
	},
	emptyLedgerTitle: {
		fontSize: 12,
		fontWeight: "700",
		color: "#fafafa",
	},
	emptyLedgerSubtitle: {
		fontSize: 11,
		color: "#71717a",
		textAlign: "center",
	},
	shiftRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	shiftRowLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	shiftDateText: {
		fontSize: 13,
		fontWeight: "700",
		color: "#fafafa",
	},
	shiftHourText: {
		fontSize: 11,
		color: "#71717a",
	},
});
