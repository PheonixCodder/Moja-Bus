import { useQueryClient } from "@tanstack/react-query";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabInset } from "@/constants/theme";
import { BookingCard } from "@/features/booking/components/booking-card";
import { BookingEmptyState } from "@/features/booking/components/booking-empty-state";
import {
	BookingFilterTab,
	BookingFilterTabs,
} from "@/features/booking/components/booking-filter-tabs";
import { BookingKpiStrip } from "@/features/booking/components/booking-kpi-strip";
import { BookingListSkeleton } from "@/features/booking/components/booking-list-skeleton";
import { useBookingPrefetch } from "@/features/booking/hooks/use-booking-prefetch";
import {
	type Booking,
	useListMyBookings,
} from "@/features/booking/hooks/use-bookings";
import { useDashboardStats } from "@/features/booking/hooks/use-dashboard-stats";
import { useTRPC } from "@/lib/trpc";

export function BookingsView() {
	const insets = useSafeAreaInsets();
	const { t } = useTranslation("booking");
	const queryClient = useQueryClient();
	const trpc = useTRPC() as any;
	const { prefetchBookings, prefetchStats, prefetchBookingDetail } =
		useBookingPrefetch();

	const [filter, setFilter] = useState<BookingFilterTab>("upcoming");
	const [refreshing, setRefreshing] = useState(false);

	const { data: stats } = useDashboardStats(true);
	const {
		data: bookingsData,
		isLoading,
		refetch,
	} = useListMyBookings(filter, 20, 0, true);

	// Prefetch on screen focus
	useFocusEffect(
		useCallback(() => {
			prefetchBookings(filter);
			prefetchStats();
		}, [filter]),
	);

	const handleRefresh = async () => {
		setRefreshing(true);
		await Promise.all([refetch(), queryClient.invalidateQueries()]);
		setRefreshing(false);
	};

	const handleCardPressIn = (bookingReference: string) => {
		// Cache seeding pattern: seed detail cache with existing item data for instant load
		const listQueryKey = trpc?.booking?.listMyBookings?.queryOptions?.({
			filter,
			limit: 20,
			offset: 0,
		})?.queryKey;
		if (listQueryKey) {
			const cachedList = queryClient.getQueryData<{ items: Booking[] }>(
				listQueryKey,
			);
			const item = cachedList?.items?.find(
				(b) => b.bookingReference === bookingReference,
			);
			if (item && trpc?.booking?.getBooking?.queryOptions) {
				const detailKey = trpc.booking.getBooking.queryOptions({
					bookingReference,
				}).queryKey;
				queryClient.setQueryData(detailKey, item);
			}
		}
		// Background prefetch full details
		prefetchBookingDetail(bookingReference);
	};

	const handleCardPress = (bookingReference: string) => {
		router.push(`/booking/${encodeURIComponent(bookingReference)}` as any);
	};

	const bookings = (bookingsData?.items ?? []) as Booking[];

	return (
		<View className="flex-1 bg-background">
			{/* KPI Stats Strip */}
			{stats ? (
				<BookingKpiStrip
					upcomingCount={stats.upcomingTripsCount}
					pendingCount={stats.pendingPaymentsCount}
					ticketsCount={stats.digitalTicketsCount}
					contactsCount={stats.savedContactsCount}
				/>
			) : null}

			{/* Filter Tabs */}
			<BookingFilterTabs
				activeTab={filter}
				onTabChange={setFilter}
				upcomingCount={stats?.upcomingTripsCount}
				pendingCount={stats?.pendingPaymentsCount}
			/>

			{/* Main Bookings List */}
			{isLoading ? (
				<BookingListSkeleton />
			) : (
				<FlatList
					data={bookings}
					keyExtractor={(item) => item.bookingReference}
					contentContainerStyle={{
						paddingHorizontal: 16,
						paddingTop: 8,
						paddingBottom: BottomTabInset + insets.bottom + 24,
					}}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={handleRefresh}
							tintColor="#ee237c"
							colors={["#ee237c"]}
						/>
					}
					renderItem={({ item }) => (
						<BookingCard
							booking={item as any}
							onPressIn={() => handleCardPressIn(item.bookingReference)}
							onPress={() => handleCardPress(item.bookingReference)}
						/>
					)}
					ListEmptyComponent={() => <BookingEmptyState />}
				/>
			)}
		</View>
	);
}
