import React, { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	FlatList,
	RefreshControl,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Briefcase01Icon } from "@hugeicons/core-free-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useTRPC } from "@/lib/trpc";
import { DriverFeedback } from "@/lib/haptics";
import { NotificationBell } from "@/components/notification-bell";
import { colors } from "@/constants/theme";
import { cn } from "@/lib/utils";
import { CounterSheet } from "../components/counter-sheet";
import { OfferCard } from "../components/offer-card";

type TabMode = "OFFERS" | "HISTORY";

export function OffersView() {
	const { t } = useTranslation("offers");
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const router = useRouter();
	const insets = useSafeAreaInsets();

	const [tab, setTab] = useState<TabMode>("OFFERS");
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
				router.replace("/(tabs)/trips");
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
				Alert.alert(t("errors.title"), message || t("errors.generic"));
			}
		},
	});

	const handleAccept = (offerId: string) => {
		DriverFeedback.tap();
		respondMutation.mutate({ offerId, action: "ACCEPT" });
	};

	const handleDecline = (offerId: string) => {
		DriverFeedback.tap();
		Alert.alert(t("decline.title"), t("decline.body"), [
			{ text: t("decline.cancel"), style: "cancel" },
			{
				text: t("decline.confirm"),
				style: "destructive",
				onPress: () => respondMutation.mutate({ offerId, action: "DECLINE" }),
			},
		]);
	};

	const handleCounter = (offerId: string) => {
		DriverFeedback.tap();
		setCounterTarget(offerId);
	};

	const handleCounterSubmit = (data: {
		counterSalaryCFA?: number;
		counterStartDate?: string;
		counterMessage?: string;
	}) => {
		if (!counterTarget) return;
		respondMutation.mutate({
			offerId: counterTarget,
			action: "COUNTER",
			...data,
		});
		setCounterTarget(null);
	};

	const items = offersQuery.data?.items ?? [];
	const pendingCount = items.filter((o) => o.status === "PENDING" || o.status === "COUNTERED").length;

	return (
		<View className="flex-1 bg-background">
			{/* Header */}
			<View
				className="px-5 pb-3.5 border-b border-border bg-background gap-3.5"
				style={{ paddingTop: insets.top + 12 }}
			>
				<View className="flex-row items-center justify-between">
					<View className="gap-0.5 flex-1">
						<Text className="text-2xl font-extrabold text-foreground tracking-tight">{t("title")}</Text>
						<Text className="text-[11px] text-muted-foreground">
							{t("subtitle", { count: pendingCount })}
						</Text>
					</View>
					<NotificationBell />
				</View>

				{/* Segmented control */}
				<View className="flex-row rounded-2xl border border-border bg-card p-1">
					{(["OFFERS", "HISTORY"] as const).map((seg) => (
						<TouchableOpacity
							key={seg}
							onPress={() => {
								DriverFeedback.tap();
								setTab(seg);
							}}
							activeOpacity={0.8}
							accessibilityRole="button"
							accessibilityLabel={seg === "OFFERS" ? t("tab.offers") : t("tab.history")}
							className={cn("flex-1 items-center rounded-xl py-2.5", tab === seg && "bg-primary")}
						>
							<Text
								className={cn(
									"text-xs font-bold",
									tab === seg ? "text-primary-foreground" : "text-muted-foreground",
								)}
							>
								{seg === "OFFERS" ? t("tab.offers") : t("tab.history")}
							</Text>
						</TouchableOpacity>
					))}
				</View>
			</View>

			{/* List */}
			{offersQuery.isLoading ? (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" color={colors.primary.rose} />
				</View>
			) : items.length === 0 ? (
				<View className="flex-1 items-center justify-center px-8 gap-2.5">
					<View className="size-16 rounded-2xl bg-card border border-border items-center justify-center">
						<HugeiconsIcon icon={Briefcase01Icon} size={28} color={colors.neutral.textMuted} />
					</View>
					<Text className="text-base font-bold text-foreground">
						{tab === "OFFERS" ? t("empty.active") : t("empty.history")}
					</Text>
					<Text className="text-center text-xs text-muted-foreground max-w-[280px] leading-5">
						{tab === "OFFERS" ? t("empty.activeHint") : null}
					</Text>
				</View>
			) : (
				<FlatList
					data={items}
					keyExtractor={(item) => item.id}
					contentContainerClassName="px-4 pt-4 gap-4"
					contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 80 }}
					showsVerticalScrollIndicator={false}
					refreshControl={
						<RefreshControl
							refreshing={!!offersQuery.isRefetching && !offersQuery.isLoading}
							onRefresh={() => offersQuery.refetch()}
							tintColor={colors.primary.rose}
						/>
					}
					renderItem={({ item }) => (
						<OfferCard
							item={item}
							onAccept={handleAccept}
							onDecline={handleDecline}
							onCounter={handleCounter}
							submitting={respondMutation.isPending}
						/>
					)}
				/>
			)}

			<CounterSheet
				open={!!counterTarget}
				onClose={() => setCounterTarget(null)}
				onSubmit={handleCounterSubmit}
				submitting={respondMutation.isPending}
			/>
		</View>
	);
}
