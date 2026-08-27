import { useState } from "react";
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	RefreshControl,
	ActivityIndicator,
	Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	Coins,
	TrendingUp,
	Clock,
	Route,
	Calendar,
	Building2,
	CheckCircle,
	ArrowUpRight,
	Play,
	StopCircle,
	Wallet,
} from "lucide-react-native";
import { useTRPC } from "@/lib/trpc";
import { DriverFeedback } from "@/lib/haptics";
import { useTranslation } from "react-i18next";

export default function DriverEarningsScreen() {
	const { t } = useTranslation("earnings");
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const {
		data: earnings,
		isLoading,
		isRefetching,
		refetch,
	} = useQuery(trpc.drivers.getMyEarnings.queryOptions());

	const { data: currentShift, refetch: refetchShift } = useQuery(
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
			Alert.alert("Shift Error", err.message || "Failed to update shift status.");
		}
	};

	const handleRequestPayout = () => {
		DriverFeedback.tap();
		Alert.alert(
			"Mobile Money Payout",
			"Your carrier automatically disburses accumulated shift earnings to your registered Mobile Money wallet (Orange / MTN / Wave) every Monday at 08:00 GMT.",
			[{ text: "Understood", style: "default" }]
		);
	};

	const todayEarnings = earnings?.todayEarningsXof ?? 0;
	const weekEarnings = earnings?.weekEarningsXof ?? 0;
	const totalTrips = earnings?.totalTripsCompleted ?? 0;
	const totalKm = Math.round(earnings?.totalDistanceKm ?? 0);
	const recentShifts = earnings?.recentShifts ?? [];

	return (
		<SafeAreaView className="flex-1 bg-zinc-950">
			{/* Top Header */}
			<View className="px-5 py-4 border-b border-zinc-800 bg-zinc-900/60 flex-row items-center justify-between">
				<View>
					<Text className="text-xl font-black text-white tracking-tight">
						Earnings & Shift Ledger
					</Text>
					<Text className="text-xs text-zinc-400 mt-0.5">
						Commercial compensation & verified shift records
					</Text>
				</View>
				<TouchableOpacity
					onPress={handleRequestPayout}
					className="p-2 rounded-xl bg-zinc-900 border border-zinc-800"
				>
					<Wallet size={18} color="#10b981" />
				</TouchableOpacity>
			</View>

			<ScrollView
				className="flex-1 px-5 py-4 space-y-4"
				refreshControl={
					<RefreshControl
						refreshing={isRefetching}
						onRefresh={() => refetch()}
						tintColor="#e11d48"
					/>
				}
			>
				{/* Hero Earnings Card */}
				<View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
					<View className="absolute top-0 right-0 p-6 opacity-10">
						<Coins size={120} color="#e11d48" />
					</View>

					<View className="flex-row items-center justify-between">
						<Text className="text-xs font-extrabold uppercase text-zinc-400 tracking-wider">
							Week-to-Date Earnings
						</Text>
						{/* Phase 31 (F-DV-11) — honest labeling: this is an ESTIMATE
						    from the flat placeholder rate until the pay-rate model
						    ships; payouts are carrier-disbursed, not "guaranteed"
						    by this app. */}
						<View className="flex-row items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
							<TrendingUp size={12} color="#f59e0b" />
							<Text className="text-[10px] font-bold text-amber-400">
								{t("estimationBadge")}
							</Text>
						</View>
					</View>

					<View className="flex-row items-baseline gap-2 mt-3">
						<Text className="text-4xl font-black text-white font-mono tracking-tight">
							{weekEarnings.toLocaleString()}
						</Text>
						<Text className="text-sm font-bold text-rose-500">XOF</Text>
					</View>

					{/* Breakdown Grid */}
					<View className="flex-row items-center gap-4 mt-5 pt-4 border-t border-zinc-800/80">
						<View className="flex-1">
							<Text className="text-[10px] uppercase text-zinc-500 font-bold">
								Today's Earnings
							</Text>
							<Text className="text-base font-black text-white font-mono mt-0.5">
								{todayEarnings.toLocaleString()} XOF
							</Text>
						</View>
						<View className="w-[1px] h-8 bg-zinc-800" />
						<View className="flex-1">
							<Text className="text-[10px] uppercase text-zinc-500 font-bold">
								Trips Completed
							</Text>
							<Text className="text-base font-black text-emerald-400 font-mono mt-0.5">
								{totalTrips} Runs
							</Text>
						</View>
					</View>
				</View>

				{/* Live Shift Control Card */}
				<View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex-row items-center justify-between">
					<View className="flex-row items-center gap-3">
						<View
							className={`size-11 rounded-xl items-center justify-center border ${
								isShiftActive
									? "bg-emerald-500/10 border-emerald-500/30"
									: "bg-zinc-950 border-zinc-800"
							}`}
						>
							<Clock size={20} color={isShiftActive ? "#10b981" : "#71717a"} />
						</View>
						<View>
							<Text className="text-sm font-bold text-white">
								{isShiftActive ? "Shift in Progress" : "Shift Inactive"}
							</Text>
							<Text className="text-xs text-zinc-400">
								{isShiftActive ? `Clocked in • ${elapsedMinutes}m elapsed` : "Ready to clock in"}
							</Text>
						</View>
					</View>

					<TouchableOpacity
						onPress={handleToggleShift}
						disabled={toggleShiftMutation.isPending}
						className={`px-4 py-2.5 rounded-xl flex-row items-center gap-1.5 ${
							isShiftActive ? "bg-zinc-800 border border-zinc-700" : "bg-rose-600"
						}`}
					>
						{toggleShiftMutation.isPending ? (
							<ActivityIndicator size="small" color="#ffffff" />
						) : isShiftActive ? (
							<>
								<StopCircle size={14} color="#f43f5e" />
								<Text className="text-xs font-bold text-rose-400">Clock Out</Text>
							</>
						) : (
							<>
								<Play size={14} color="#ffffff" fill="#ffffff" />
								<Text className="text-xs font-bold text-white">Clock In</Text>
							</>
						)}
					</TouchableOpacity>
				</View>

				{/* Phase 7 (Gap #17a) — Carrier Compensation Breakdown */}
				{earnings?.byCompany && earnings.byCompany.length > 0 && (
					<View className="space-y-3 pt-2">
						<Text className="text-xs font-bold text-zinc-400 uppercase">
							Carrier Compensation Breakdown
						</Text>
						{earnings.byCompany.map((comp: any) => (
							<View
								key={comp.companyId}
								className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-2"
							>
								<View className="flex-row items-center justify-between">
									<View className="flex-row items-center gap-2.5">
										<View className="size-8 rounded-lg bg-zinc-950 border border-zinc-800 items-center justify-center">
											<Building2 size={16} color="#e11d48" />
										</View>
										<View>
											<Text className="text-sm font-bold text-white">
												{comp.companyName}
											</Text>
											<Text className="text-[10px] text-zinc-400">
												{comp.employmentType?.replace("_", " ")} • {comp.rateDescription}
											</Text>
										</View>
									</View>
									<View className="items-end">
										<Text className="text-sm font-bold font-mono text-emerald-400">
											{comp.weekEarningsXof.toLocaleString()} XOF
										</Text>
										<Text className="text-[10px] text-zinc-500">
											{comp.weekMinutes}m this week
										</Text>
									</View>
								</View>
							</View>
						))}
					</View>
				)}

				{/* Shift Ledger History */}
				<View className="space-y-3 pt-2">
					<Text className="text-xs font-bold text-zinc-400 uppercase">
						Recent Shift History
					</Text>

					{recentShifts.length === 0 ? (
						<View className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 items-center justify-center text-center">
							<Clock size={32} color="#52525b" />
							<Text className="text-xs font-bold text-white mt-2">No Shift Logs Yet</Text>
							<Text className="text-[11px] text-zinc-500 mt-0.5">
								Completed on-duty shifts will appear here with detailed duration.
							</Text>
						</View>
					) : (
						recentShifts.map((shift: any) => {
							const startTime = new Date(shift.startedAt).toLocaleTimeString([], {
								hour: "2-digit",
								minute: "2-digit",
							});
							const dateStr = new Date(shift.startedAt).toLocaleDateString([], {
								month: "short",
								day: "numeric",
							});

							return (
								<View
									key={shift.id}
									className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex-row items-center justify-between"
								>
									<View className="flex-row items-center gap-3">
										<View className="size-10 rounded-xl bg-zinc-950 border border-zinc-800 items-center justify-center">
											<Calendar size={16} color="#e11d48" />
										</View>
										<View>
											<Text className="text-sm font-bold text-white">
												{dateStr} • {startTime}
											</Text>
											<Text className="text-xs text-zinc-400">
												{shift.company?.name ?? "Commercial Run"} • {shift.totalMinutes ?? 0} mins
											</Text>
										</View>
									</View>

									<View className="items-end">
										<Text className="text-xs font-mono font-bold text-emerald-400">
											+{shift.tripsCompleted} Trips
										</Text>
										<Text className="text-[10px] text-zinc-500">Verified</Text>
									</View>
								</View>
							);
						})
					)}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
