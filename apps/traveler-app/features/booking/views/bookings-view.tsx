import { Colors, Spacing } from "@moja/theme/tokens";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
	FlatList,
	Pressable,
	RefreshControl,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SubpageHeader } from "@/components/subpage-header";
import { Text } from "@/components/ui/text";
import { BottomTabInset } from "@/constants/theme";
import { BookingCard } from "@/features/booking/components/booking-card";
import { BookingKpiStrip } from "@/features/booking/components/booking-kpi-strip";
import { useListMyBookings } from "@/features/booking/hooks/use-bookings";
import { useDashboardStats } from "@/features/booking/hooks/use-dashboard-stats";

type FilterTab = "upcoming" | "pending" | "past";

export function BookingsView() {
	const insets = useSafeAreaInsets();
	const { t } = useTranslation("booking");
	const queryClient = useQueryClient();
	const [filter, setFilter] = useState<FilterTab>("upcoming");
	const [refreshing, setRefreshing] = useState(false);

	const { data: stats, isLoading: statsLoading } = useDashboardStats(true);

	const {
		data: bookingsData,
		isLoading,
		isFetching,
		refetch,
	} = useListMyBookings(filter, 20, 0, true);

	const handleRefresh = async () => {
		setRefreshing(true);
		await refetch();
		setRefreshing(false);
	};

	type BookingItem = {
		bookingReference: string;
		status: string;
		origin: string;
		destination: string;
		departureTime: string;
		arrivalTime: string;
		seatLabel?: string;
		farePaidXOF?: number;
		holdExpiresAt?: string;
	};

	const bookings = (bookingsData?.items ?? []) as BookingItem[];

	if (statsLoading) {
		return (
			<View
				style={{
					flex: 1,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: Colors.light.background,
				}}
			>
				<ActivityIndicator size="large" color={Colors.light.primary} />
			</View>
		);
	}

	return (
		<View style={{ flex: 1, backgroundColor: Colors.light.background }}>
			<SubpageHeader title={t("bookings")} />

			{stats ? (
				<BookingKpiStrip
					upcomingCount={stats.upcomingTripsCount}
					pendingCount={stats.pendingPaymentsCount}
					ticketsCount={stats.digitalTicketsCount}
					contactsCount={stats.savedContactsCount}
				/>
			) : null}

			<View
				style={{
					flexDirection: "row",
					gap: Spacing.two,
					paddingHorizontal: Spacing.four,
					paddingVertical: Spacing.two,
				}}
			>
				{(["upcoming", "pending", "past"] as FilterTab[]).map((tab) => (
					<Pressable
						key={tab}
						onPress={() => setFilter(tab)}
						style={({ pressed }) => ({
							paddingHorizontal: Spacing.four,
							paddingVertical: Spacing.two,
							borderRadius: 100,
							backgroundColor:
								filter === tab ? Colors.light.primary : Colors.light.background,
							borderWidth: 1,
							borderColor:
								filter === tab
									? Colors.light.primary
									: Colors.light.backgroundSelected,
							opacity: pressed ? 0.7 : 1,
						})}
					>
						<Text
							style={{
								fontSize: 12,
								fontWeight: "700",
								color:
									filter === tab
										? Colors.light.primaryForeground
										: Colors.light.text,
								textTransform: "capitalize",
							}}
						>
							{t(tab)}
						</Text>
					</Pressable>
				))}
			</View>

			{isLoading ? (
				<View style={{ flex: 1, alignItems: "center", paddingTop: 40 }}>
					<ActivityIndicator size="large" color={Colors.light.primary} />
				</View>
			) : (
				<FlatList
					data={bookings}
					keyExtractor={(item: BookingItem) => item.bookingReference}
					contentContainerStyle={{
						paddingHorizontal: Spacing.four,
						paddingTop: Spacing.two,
						paddingBottom: BottomTabInset + insets.bottom + 24,
						gap: Spacing.three,
					}}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={handleRefresh}
							tintColor={Colors.light.primary}
						/>
					}
					renderItem={({ item }: { item: BookingItem }) => (
						<BookingCard
							bookingReference={item.bookingReference}
							status={item.status as any}
							origin={item.origin ?? ""}
							destination={item.destination ?? ""}
							departureTime={item.departureTime ?? ""}
							arrivalTime={item.arrivalTime ?? ""}
							seatLabel={item.seatLabel}
							farePaidXOF={item.farePaidXOF}
							_holdExpiresAt={item.holdExpiresAt}
							_onPress={() => {}}
						/>
					)}
					ListEmptyComponent={() => (
						<View
							style={{
								flex: 1,
								alignItems: "center",
								justifyContent: "center",
								paddingVertical: 80,
								gap: Spacing.four,
							}}
						>
							<Text
								style={{
									fontSize: 15,
									fontWeight: "500",
									color: Colors.light.textSecondary,
								}}
							>
								{t("noBookings")}
							</Text>
							<Text
								style={{
									fontSize: 13,
									fontWeight: "400",
									color: Colors.light.textSecondary,
									textAlign: "center",
									maxWidth: 280,
									lineHeight: 18,
								}}
							>
								{t("bookYourFirstTrip")}
							</Text>
						</View>
					)}
				/>
			)}
		</View>
	);
}
