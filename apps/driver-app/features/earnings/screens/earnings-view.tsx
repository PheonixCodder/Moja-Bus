import React from "react";
import {
	View,
	Text,
	ScrollView,
	Pressable,
	RefreshControl,
	Alert,
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
import { cn } from "@/lib/utils";

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
			Alert.alert(t("errors.shiftToggle"), err.message || t("errors.shiftToggleMsg"));
		}
	};

	const handleRequestPayout = () => {
		DriverFeedback.tap();
		Alert.alert(
			t("payout.title"),
			t("payout.body"),
			[{ text: t("payout.confirm"), style: "default" }]
		);
	};

	const todayEarnings = earnings?.todayEarningsXof ?? 0;
	const weekEarnings = earnings?.weekEarningsXof ?? 0;
	const totalTrips = earnings?.totalTripsCompleted ?? 0;
	const recentShifts = earnings?.recentShifts ?? [];

	return (
		<View className="flex-1 bg-background">
			{/* Top Header */}
			<View
				className="px-5 pb-3.5 border-b border-border bg-background flex-row items-center justify-between"
				style={{ paddingTop: insets.top + 12 }}
			>
				<View className="gap-0.5 flex-1">
					<Text className="text-xl font-extrabold text-foreground tracking-tight">{t("headerTitle")}</Text>
					<Text className="text-xs text-muted-foreground">{t("headerSubtitle")}</Text>
				</View>
				<Pressable
					onPress={handleRequestPayout}
					accessibilityRole="button"
					accessibilityLabel={t("payout.title")}
					className="size-10 rounded-2xl bg-card border border-border items-center justify-center active:bg-secondary"
				>
					<HugeiconsIcon icon={Wallet01Icon} size={18} color={colors.semantic.success} />
				</Pressable>
			</View>

			<ScrollView
				className="flex-1"
				contentContainerClassName="px-4 pt-4 gap-4"
				contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 80 }}
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
				<Card className="p-6 gap-4 relative overflow-hidden bg-card border-border">
					<View className="flex-row items-center justify-between">
						<Text className="text-xs font-bold uppercase text-muted-foreground tracking-wider">{t("thisWeek")}</Text>
						<Badge
							variant="warning"
							label={t("estimationBadge") || "Estimation"}
						/>
					</View>

					<View className="flex-row items-baseline gap-2">
						<Text className="text-4xl font-extrabold text-foreground font-mono tracking-tight">
							{weekEarnings.toLocaleString()}
						</Text>
						<Text className="text-sm font-bold text-primary">XOF</Text>
					</View>

					{/* Breakdown Grid */}
					<View className="flex-row items-center gap-4 pt-4 border-t border-border">
						<View className="flex-1 gap-0.5">
							<Text className="text-xs uppercase text-muted-foreground font-bold">{t("todayLabel")}</Text>
							<Text className="text-base font-bold text-foreground font-mono">
								{todayEarnings.toLocaleString()} XOF
							</Text>
						</View>
						<View className="w-[1px] h-8 bg-border" />
						<View className="flex-1 gap-0.5">
							<Text className="text-xs uppercase text-muted-foreground font-bold">{t("tripsCompletedLabel")}</Text>
							<Text className="text-base font-bold text-success font-mono">
								{totalTrips} {t("tripsCompleted")}
							</Text>
						</View>
					</View>
				</Card>

				{/* Live Shift Control Card */}
				<Card className="p-4 flex-row items-center justify-between">
					<View className="flex-row items-center gap-3">
						<View
							className={cn(
								"size-11 rounded-2xl items-center justify-center border",
								isShiftActive
									? "bg-success/15 border-success/30"
									: "bg-card border-border",
							)}
						>
							<HugeiconsIcon
								icon={Clock01Icon}
								size={20}
								color={isShiftActive ? colors.semantic.success : colors.neutral.textMuted}
							/>
						</View>
						<View>
							<Text className="text-sm font-bold text-foreground">
								{isShiftActive ? t("shiftOnDuty") : t("shiftOffDuty")}
							</Text>
							<Text className="text-xs text-muted-foreground">
								{isShiftActive ? t("shift.activeSub", { minutes: elapsedMinutes }) : t("shift.inactiveSub")}
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
								color={isShiftActive ? colors.semantic.error : colors.neutral.textPrimary}
							/>
						}
						textClassName={isShiftActive ? "text-destructive" : undefined}
					/>
				</Card>

				{/* Carrier Compensation Breakdown — DRV-P2-10 */}
				{earnings?.byCompany && earnings.byCompany.length > 0 && (
					<View className="gap-3 pt-1.5">
						<Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("carrierBreakdown")}</Text>
						{earnings.byCompany.map(
							(comp: NonNullable<typeof earnings>["byCompany"][number]) => (
								<Card key={comp.companyId} className="p-4 gap-2">
									{/* Header row: company icon + name/rate + week amount */}
									<View className="flex-row items-center justify-between">
										<View className="flex-row items-center gap-2.5">
											<View className="size-8 rounded-xl bg-background border border-border items-center justify-center">
												<HugeiconsIcon icon={Building01Icon} size={16} color={colors.primary.rose} />
											</View>
											<View className="flex-1 gap-0.5">
												<Text className="text-sm font-bold text-foreground">{comp.companyName}</Text>
												<Text className="text-xs text-muted-foreground">
													{comp.employmentType?.replace(/_/g, " ")} • {comp.rateDescription}
												</Text>
											</View>
										</View>

										<View className="items-end gap-0.5">
											{comp.isEstimated && (
												<Badge
													variant="warning"
													label={t("estimationBadge") || "Est."}
												/>
											)}
											<Text className="text-sm font-bold font-mono text-success">
												{comp.weekEarningsXof.toLocaleString()} XOF
											</Text>
											{comp.payModel === "PER_TRIP" ? (
												<Text className="text-xs text-muted-foreground">
													{t("carrierWeekTrips", { trips: comp.weekTrips })}
												</Text>
											) : (
												<Text className="text-xs text-muted-foreground">
													{t("carrierWeekMinutes", { minutes: comp.weekMinutes })}
												</Text>
											)}
										</View>
									</View>

									{/* Today's per-carrier earnings row */}
									<View className="flex-row items-center justify-between pt-2 mt-1 border-t border-border">
										<Text className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("todayLabel")}</Text>
										<Text className="text-xs font-bold font-mono text-muted-foreground">
											{comp.todayEarningsXof.toLocaleString()} XOF
										</Text>
									</View>
								</Card>
							),
						)}
					</View>
				)}

				{/* Shift Ledger History */}
				<View className="gap-3 pt-1.5">
					<Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("recentShifts")}</Text>

					{recentShifts.length === 0 ? (
						<Card className="p-6 items-center justify-center text-center gap-1.5">
							<HugeiconsIcon icon={Clock01Icon} size={32} color={colors.neutral.textMuted} />
							<Text className="text-xs font-bold text-foreground">{t("emptyLedger")}</Text>
							<Text className="text-xs text-muted-foreground text-center">{t("emptyLedgerDesc")}</Text>
						</Card>
					) : (
						recentShifts.map((shift: any) => {
							const start = new Date(shift.startedAt);
							const durationMins = shift.endedAt
								? Math.round((new Date(shift.endedAt).getTime() - start.getTime()) / 60000)
								: null;

							return (
								<Card key={shift.id} className="p-4 gap-2">
									<View className="flex-row items-center justify-between">
										<View className="flex-row items-center gap-3">
											<HugeiconsIcon icon={Calendar01Icon} size={16} color={colors.neutral.textSecondary} />
											<View>
												<Text className="text-sm font-bold text-foreground">
													{start.toLocaleDateString([], {
														weekday: "short",
														day: "numeric",
														month: "short",
													})}
												</Text>
												<Text className="text-xs text-muted-foreground">
													{start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
													{shift.endedAt
														? ` → ${new Date(shift.endedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
														: t("shift.inProgress")}
												</Text>
											</View>
										</View>

										<Badge
											variant={shift.status === "COMPLETED" ? "default" : "warning"}
											label={
												shift.status === "COMPLETED"
													? `${durationMins ?? 0} min`
													: t("shift.statusActive")
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
