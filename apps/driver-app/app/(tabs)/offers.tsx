import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	FlatList,
	Image,
	Modal,
	Pressable,
	RefreshControl,
	Text,
	TextInput,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
	Briefcase,
	Clock,
	CalendarDays,
	CheckCircle2,
	XCircle,
	RefreshCw,
	AlertTriangle,
} from "lucide-react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useTRPC } from "@/lib/trpc";
import { DriverFeedback } from "@/lib/haptics";
import { NotificationBell } from "@/components/notification-bell";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_META: Record<
	string,
	{ bg: string; text: string; labelKey: string }
> = {
	PENDING: { bg: "#422006", text: "#fbbf24", labelKey: "status.PENDING" },
	COUNTERED: { bg: "#172554", text: "#93c5fd", labelKey: "status.COUNTERED" },
	ACCEPTED: { bg: "#022c22", text: "#6ee7b7", labelKey: "status.ACCEPTED" },
	DECLINED: { bg: "#4c0519", text: "#fda4af", labelKey: "status.DECLINED" },
	EXPIRED: { bg: "#27272a", text: "#a1a1aa", labelKey: "status.EXPIRED" },
	WITHDRAWN: { bg: "#27272a", text: "#71717a", labelKey: "status.WITHDRAWN" },
};

const EMPLOYMENT_LABELS: Record<string, string> = {
	EXCLUSIVE_INTERCITY: "Intercity exclusif",
	CONTRACTOR_URBAN: "Contractuel urbain",
	HYBRID: "Hybride",
};

function timeLeft(expiresAt: string | Date): string | null {
	const ms = new Date(expiresAt).getTime() - Date.now();
	if (ms <= 0) return null;
	const hours = Math.floor(ms / 3600000);
	if (hours < 48) return `${hours}h`;
	return `${Math.floor(hours / 24)}j ${hours % 24}h`;
}

function fmtSalary(n: number): string {
	return n.toLocaleString("fr-FR");
}

function fmtDate(d: string | Date | null | undefined): string {
	if (!d) return "—";
	return new Date(d).toLocaleDateString("fr-FR", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

// ─── Counter-offer sheet ─────────────────────────────────────────────────────

function CounterSheet({
	open,
	onClose,
	onSubmit,
	submitting,
}: {
	open: boolean;
	onClose: () => void;
	onSubmit: (input: { counterSalaryCFA: number; counterStartDate?: string; note?: string }) => void;
	submitting: boolean;
}) {
	const { t } = useTranslation("offers");
	const [salary, setSalary] = useState("");
	const [startDate, setStartDate] = useState("");
	const [note, setNote] = useState("");

	const salaryNum = Number(salary.replace(/[^\d]/g, ""));
	const valid = Number.isFinite(salaryNum) && salaryNum >= 1000;

	const reset = () => {
		setSalary("");
		setStartDate("");
		setNote("");
	};

	return (
		<Modal visible={open} transparent animationType="slide">
			<View className="flex-1 justify-end bg-black/60">
				<Pressable style={{ flex: 1 }} onPress={onClose} />
				<View className="rounded-t-3xl border-t border-[#27272a] bg-[#18181b] px-5 pb-10 pt-5">
					<Text className="mb-1 text-lg font-bold text-zinc-50">
						{t("counter.title")}
					</Text>
					<Text className="mb-4 text-xs text-zinc-500">
						{t("counter.subtitle")}
					</Text>

					<Text className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
						{t("counter.salaryLabel")}
					</Text>
					<TextInput
						className="mb-3 rounded-xl border border-[#27272a] bg-[#09090b] px-4 py-3 text-zinc-50"
						placeholderTextColor="#52525b"
						keyboardType="number-pad"
						placeholder="250000"
						value={salary}
						onChangeText={(v) => {
							DriverFeedback.tap();
							setSalary(v);
						}}
					/>
					{valid ? (
						<Text className="-mt-2 mb-3 text-[11px] font-medium text-emerald-400">
							{fmtSalary(salaryNum)} FCFA / mois
						</Text>
					) : null}

					<Text className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
						{t("counter.dateLabel")}
					</Text>
					<TextInput
						className="mb-3 rounded-xl border border-[#27272a] bg-[#09090b] px-4 py-3 text-zinc-50"
						placeholderTextColor="#52525b"
						placeholder="2026-09-01"
						value={startDate}
						onChangeText={setStartDate}
					/>

					<Text className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
						{t("counter.noteLabel")}
					</Text>
					<TextInput
						className="mb-5 rounded-xl border border-[#27272a] bg-[#09090b] px-4 py-3 text-zinc-50"
						placeholderTextColor="#52525b"
						multiline
						numberOfLines={3}
						maxLength={2000}
						placeholder={t("counter.notePlaceholder")}
						value={note}
						onChangeText={setNote}
					/>

					<View className="flex-row gap-3">
						<Pressable
							onPress={() => {
								reset();
								onClose();
							}}
							className="flex-1 items-center rounded-xl border border-[#27272a] py-3.5 active:opacity-70"
						>
							<Text className="font-semibold text-zinc-300">
								{t("counter.cancel")}
							</Text>
						</Pressable>
						<Pressable
							disabled={!valid || submitting}
							onPress={() => {
								if (!valid) return;
								onSubmit({
									counterSalaryCFA: salaryNum,
									counterStartDate: startDate || undefined,
									note: note.trim() || undefined,
								});
								reset();
							}}
							className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl py-3.5 active:opacity-70 ${
								valid ? "bg-[#e11d48]" : "bg-[#e11d48]/40"
							}`}
						>
							{submitting ? (
								<ActivityIndicator size="small" color="#fff" />
							) : (
								<Text className="font-bold text-white">
									{t("counter.submit")}
								</Text>
							)}
						</Pressable>
					</View>
				</View>
			</View>
		</Modal>
	);
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function OffersScreen() {
	const { t } = useTranslation("offers");
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const router = useRouter();

	const [tab, setTab] = useState<"OFFERS" | "HISTORY">("OFFERS");
	const [counterTarget, setCounterTarget] = useState<string | null>(null);

	const offersQuery = useQuery(
		trpc.drivers.getMyOffers.queryOptions({
			status: tab === "OFFERS" ? "ACTIVE" : undefined,
			page: 1,
			limit: 50,
		}),
	);

	const seenMutation = useMutation({
		...trpc.drivers.markMyOffersSeen.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.drivers.getMyOffers.queryKey(),
			});
		},
	});

	useEffect(() => {
		seenMutation.mutate({});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const respondMutation = useMutation({
		...trpc.drivers.respondToOffer.mutationOptions(),
		onSuccess: (_data, vars) => {
			DriverFeedback.successScan();
			queryClient.invalidateQueries({
				queryKey: trpc.drivers.getMyOffers.queryKey(),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.drivers.getMyProfile.queryKey(),
			});
			if (vars.action === "ACCEPT") {
				// Pre-existing typed-router breakage fixed in Phase-1 audit pass:
				// "/(tabs)" is not a generated route literal. Cast preserves the
				// runtime target; route cleanup belongs to a nav-typing sweep.
				router.replace("/(tabs)" as any);
			}
		},
		onError: (err: any, vars) => {
			const message: string = err?.message ?? "";
			if (message.startsWith("EXCLUSIVE_CONFLICT_REQUIRED::")) {
				const companies = message.split("::")[1]?.split("|") ?? [];
				DriverFeedback.invalidScan();
				Alert.alert(
					t("exclusive.title"),
					t("exclusive.message", { companies: companies.join(", ") }),
					[
						{ text: t("exclusive.cancel"), style: "cancel" },
						{
							text: t("exclusive.confirm"),
							style: "destructive",
							onPress: () => {
								respondMutation.mutate({
									offerId: vars.offerId,
									action: "ACCEPT",
									confirmExclusiveSwitch: true,
								});
							},
						},
					],
				);
			} else {
				DriverFeedback.invalidScan();
				alert(err?.message || t("errors.generic"));
			}
		},
	});

	const acceptWithConsent = (offerId: string) => {
		respondMutation.mutate({ offerId, action: "ACCEPT" });
	};

	const items: any[] = offersQuery.data?.items ?? [];
	const total = offersQuery.data?.total ?? 0;

	const pendingCount =
		items.filter((o) => o.status === "PENDING" || o.status === "COUNTERED").length;

	return (
		<SafeAreaView className="flex-1 bg-[#09090b]" edges={["top"]}>
			{/* Header */}
			<View className="flex-row items-center justify-between border-b border-[#27272a] px-5 pb-3 pt-2">
				<View>
					<Text className="text-2xl font-extrabold text-zinc-50">
						{t("title")}
					</Text>
					<Text className="text-xs text-zinc-500">
						{t("subtitle", { count: pendingCount })}
					</Text>
				</View>
				<NotificationBell />
			</View>

			{/* Segmented control */}
			<View className="mx-5 mt-4 flex-row rounded-xl border border-[#27272a] bg-[#18181b] p-1">
				{(["OFFERS", "HISTORY"] as const).map((seg) => (
					<Pressable
						key={seg}
						onPress={() => {
							DriverFeedback.tap();
							setTab(seg);
						}}
						className={`flex-1 items-center rounded-lg py-2 ${
							tab === seg ? "bg-[#e11d48]" : ""
						}`}
					>
						<Text
							className={`text-xs font-bold ${
								tab === seg ? "text-white" : "text-zinc-400"
							}`}
						>
							{seg === "OFFERS" ? t("tab.offers") : t("tab.history")}
						</Text>
					</Pressable>
				))}
			</View>

			{/* List */}
			{offersQuery.isLoading ? (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" color="#e11d48" />
				</View>
			) : items.length === 0 ? (
				<View className="flex-1 items-center justify-center px-8">
					<View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-[#27272a]">
						<Briefcase size={28} color="#71717a" />
					</View>
					<Text className="mb-1 text-base font-bold text-zinc-200">
						{tab === "OFFERS" ? t("empty.active") : t("empty.history")}
					</Text>
					<Text className="text-center text-sm text-zinc-500">
						{tab === "OFFERS" ? t("empty.activeHint") : null}
					</Text>
				</View>
			) : (
				<FlatList
					data={items}
					keyExtractor={(item) => item.id}
					contentContainerClassName="px-5 pb-8 pt-4 gap-4"
					refreshControl={
						<RefreshControl
							refreshing={!!offersQuery.isRefetching && !offersQuery.isLoading}
							onRefresh={() => offersQuery.refetch()}
							tintColor="#e11d48"
						/>
					}
					renderItem={({ item }) => {
						const meta =
							STATUS_META[item.status as string] ?? {
								bg: "#27272a",
								text: "#a1a1aa",
								labelKey: "status.EXPIRED",
							};
						const isLive = item.status === "PENDING" || item.status === "COUNTERED";
						const countdown = isLive ? timeLeft(item.expiresAt) : null;
						const countered =
							item.status === "COUNTERED" &&
							item.currentSalaryCFA !== item.initialSalaryCFA;

						return (
							<View className="rounded-2xl border border-[#27272a] bg-[#18181b] p-4">
								{/* Company row */}
								<View className="flex-row items-center gap-3">
									{item.company.logoUrl ? (
										<Image
											source={{ uri: item.company.logoUrl }}
											className="size-12 rounded-full border border-[#27272a]"
										/>
									) : (
										<View className="size-12 items-center justify-center rounded-full border border-[#27272a] bg-[#09090b]">
											<Briefcase size={20} color="#a1a1aa" />
										</View>
									)}
									<View className="min-w-0 flex-1">
										<Text className="text-base font-bold text-zinc-50">
											{item.company.name}
										</Text>
										<Text className="text-xs text-zinc-500">
											{EMPLOYMENT_LABELS[item.employmentType] ??
												item.employmentType}
										</Text>
									</View>
									<View
										className="rounded-full px-2.5 py-1"
										style={{ backgroundColor: meta.bg }}
									>
										<Text
											className="text-[10px] font-bold"
											style={{ color: meta.text }}
										>
											{t(meta.labelKey)}
										</Text>
									</View>
								</View>

								{/* Terms */}
								<View className="mt-4 rounded-xl border border-[#27272a] bg-[#09090b] px-4 py-3">
									<View className="flex-row items-baseline justify-between">
										<Text className="text-xs uppercase tracking-wide font-bold text-zinc-500">
											{t("terms.salary")}
										</Text>
										{countdown ? (
											<View className="flex-row items-center gap-1">
												<Clock
													size={11}
													color={
														new Date(item.expiresAt).getTime() - Date.now() <
														24 * 3600 * 1000
															? "#fb7185"
															: "#71717a"
													}
												/>
												<Text
													className={`text-[11px] font-semibold ${
														new Date(item.expiresAt).getTime() - Date.now() <
														24 * 3600 * 1000
															? "text-rose-400"
															: "text-zinc-500"
													}`}
												>
													{countdown}
												</Text>
											</View>
										) : null}
									</View>
									<View className="mt-1 flex-row items-baseline gap-2">
										{countered ? (
											<Text className="text-sm font-medium text-zinc-600 line-through">
												{fmtSalary(item.initialSalaryCFA)}
											</Text>
										) : null}
										<Text className="text-xl font-extrabold text-emerald-400">
											{fmtSalary(item.currentSalaryCFA)}{" "}
											<Text className="text-xs font-semibold text-zinc-500">
												FCFA/{t("terms.monthShort")}
											</Text>
										</Text>
									</View>

									<View className="mt-2 flex-row items-center gap-1.5">
										<CalendarDays size={13} color="#71717a" />
										<Text className="text-xs text-zinc-400">
											{t("terms.start")}: {fmtDate(item.currentStartDate ?? item.initialStartDate)}
										</Text>
									</View>

									{(item.currentNote || item.initialNote) && isLive ? (
										<Text className="mt-2 italic text-xs leading-5 text-zinc-400">
											“{item.currentNote ?? item.initialNote}”
										</Text>
									) : null}
								</View>

								{/* Actions */}
								{isLive ? (
									<View className="mt-4 flex-row gap-2.5">
										<Pressable
											onPress={() => {
												DriverFeedback.tap();
												setCounterTarget(item.id);
											}}
											className="flex-1 items-center rounded-xl border border-[#27272a] py-3 active:opacity-70"
										>
											<Text className="text-sm font-bold text-zinc-300">
												{t("actions.counter")}
											</Text>
										</Pressable>
										<Pressable
											onPress={() => {
												DriverFeedback.invalidScan();
												respondMutation.mutate({ offerId: item.id, action: "DECLINE" });
											}}
											className="w-14 items-center justify-center rounded-xl border border-[#27272a] py-3 active:opacity-70"
										>
											<XCircle size={20} color="#fb7185" />
										</Pressable>
										<Pressable
											onPress={() => {
												DriverFeedback.tap();
												acceptWithConsent(item.id);
											}}
											className="w-24 flex-row items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-3 active:opacity-80"
										>
											<CheckCircle2 size={18} color="#fff" />
											<Text className="text-sm font-bold text-white">
												{t("actions.accept")}
											</Text>
										</Pressable>
									</View>
								) : (
									<View className="mt-3 flex-row items-center gap-1.5">
										<AlertTriangle size={12} color="#52525b" />
										<Text className="text-[11px] text-zinc-600">
											{t("resolvedAt", { date: fmtDate(item.resolvedAt ?? item.updatedAt) })}
										</Text>
									</View>
								)}
							</View>
						);
					}}
				/>
			)}

			{/* Counter sheet */}
			<CounterSheet
				open={!!counterTarget}
				onClose={() => setCounterTarget(null)}
				submitting={respondMutation.isPending}
				onSubmit={(input) => {
					if (!counterTarget) return;
					respondMutation.mutate({
						offerId: counterTarget,
						action: "COUNTER",
						...input,
					});
					setCounterTarget(null);
				}}
			/>

			{total > 0 && tab === "HISTORY" && total > items.length ? (
				<Text className="pb-4 text-center text-xs text-zinc-600">
					{total - items.length} {t("moreHidden")}
				</Text>
			) : null}
		</SafeAreaView>
	);
}
