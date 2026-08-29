import React, { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	FlatList,
	RefreshControl,
	Text,
	TouchableOpacity,
	View,
	StyleSheet,
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
				Alert.alert(t("error.title"), message || t("error.generic"));
			}
		},
	});

	const handleAccept = (offerId: string) => {
		DriverFeedback.tap();
		respondMutation.mutate({ offerId, action: "ACCEPT" });
	};

	const handleDecline = (offerId: string) => {
		DriverFeedback.tap();
		Alert.alert(t("decline.confirmTitle"), t("decline.confirmBody"), [
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
		counterSalaryCFA: number;
		counterStartDate?: string;
		note?: string;
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
		<View style={styles.root}>
			{/* Header */}
			<View style={[styles.headerContainer, { paddingTop: insets.top + 12 }]}>
				<View style={styles.headerRow}>
					<View style={styles.headerTitleWrap}>
						<Text style={styles.headerTitle}>{t("title")}</Text>
						<Text style={styles.headerSubtitle}>
							{t("subtitle", { count: pendingCount })}
						</Text>
					</View>
					<NotificationBell />
				</View>

				{/* Segmented control */}
				<View style={styles.tabBar}>
					{(["OFFERS", "HISTORY"] as const).map((seg) => (
						<TouchableOpacity
							key={seg}
							onPress={() => {
								DriverFeedback.tap();
								setTab(seg);
							}}
							activeOpacity={0.8}
							style={[styles.tabChip, tab === seg && styles.tabChipSelected]}
						>
							<Text
								style={[styles.tabChipText, tab === seg && styles.tabChipTextSelected]}
							>
								{seg === "OFFERS" ? t("tab.offers") : t("tab.history")}
							</Text>
						</TouchableOpacity>
					))}
				</View>
			</View>

			{/* List */}
			{offersQuery.isLoading ? (
				<View style={styles.loadingBox}>
					<ActivityIndicator size="large" color={colors.primary.rose} />
				</View>
			) : items.length === 0 ? (
				<View style={styles.emptyBox}>
					<View style={styles.emptyIconWrap}>
						<HugeiconsIcon icon={Briefcase01Icon} size={28} color="#71717a" />
					</View>
					<Text style={styles.emptyTitle}>
						{tab === "OFFERS" ? t("empty.active") : t("empty.history")}
					</Text>
					<Text style={styles.emptySubtitle}>
						{tab === "OFFERS" ? t("empty.activeHint") : null}
					</Text>
				</View>
			) : (
				<FlatList
					data={items}
					keyExtractor={(item) => item.id}
					contentContainerStyle={[
						styles.listContent,
						{ paddingBottom: Math.max(insets.bottom, 24) + 80 },
					]}
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

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: "#09090b",
	},
	headerContainer: {
		paddingHorizontal: 20,
		paddingBottom: 14,
		borderBottomWidth: 1,
		borderBottomColor: "#27272a",
		backgroundColor: "#09090b",
		gap: 14,
	},
	headerRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	headerTitleWrap: {
		gap: 2,
		flex: 1,
	},
	headerTitle: {
		fontSize: 22,
		fontWeight: "800",
		color: "#fafafa",
		letterSpacing: -0.4,
	},
	headerSubtitle: {
		fontSize: 11,
		color: "#a1a1aa",
	},
	tabBar: {
		flexDirection: "row",
		borderRadius: 14,
		borderWidth: 1,
		borderColor: "#27272a",
		backgroundColor: "#18181b",
		padding: 3,
	},
	tabChip: {
		flex: 1,
		alignItems: "center",
		borderRadius: 10,
		paddingVertical: 9,
	},
	tabChipSelected: {
		backgroundColor: "#ee237c",
	},
	tabChipText: {
		fontSize: 12,
		fontWeight: "700",
		color: "#a1a1aa",
	},
	tabChipTextSelected: {
		color: "#ffffff",
	},
	loadingBox: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	emptyBox: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 32,
		gap: 10,
	},
	emptyIconWrap: {
		width: 64,
		height: 64,
		borderRadius: 20,
		backgroundColor: "#18181b",
		borderWidth: 1,
		borderColor: "#27272a",
		alignItems: "center",
		justifyContent: "center",
	},
	emptyTitle: {
		fontSize: 16,
		fontWeight: "700",
		color: "#fafafa",
	},
	emptySubtitle: {
		textAlign: "center",
		fontSize: 12,
		color: "#a1a1aa",
		maxWidth: 280,
		lineHeight: 18,
	},
	listContent: {
		paddingHorizontal: 16,
		paddingTop: 16,
		gap: 16,
	},
});
