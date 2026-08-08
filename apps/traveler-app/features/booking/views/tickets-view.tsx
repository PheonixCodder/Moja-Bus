import { useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabInset } from "@/constants/theme";
import { CancelDialog } from "@/features/booking/components/cancel-dialog";
import { DigitalTicketCard } from "@/features/booking/components/digital-ticket-card";
import { TicketEmptyState } from "@/features/booking/components/ticket-empty-state";
import { TicketListSkeleton } from "@/features/booking/components/ticket-list-skeleton";
import { TicketSheet } from "@/features/booking/components/ticket-sheet";
import { useBookingPrefetch } from "@/features/booking/hooks/use-booking-prefetch";
import {
	type Booking,
	useListMyBookings,
} from "@/features/booking/hooks/use-bookings";

export function TicketsView() {
	const insets = useSafeAreaInsets();
	const { t } = useTranslation("booking");
	const queryClient = useQueryClient();
	const { prefetchBookings, prefetchTicket } = useBookingPrefetch();

	const [activeTicket, setActiveTicket] = useState<{
		bookingReference: string;
		ticketToken: string;
	} | null>(null);
	const [cancelOpen, setCancelOpen] = useState(false);

	const {
		data: bookingsData,
		isLoading,
		isFetching,
		refetch,
	} = useListMyBookings("confirmed", 50, 0, true);

	useFocusEffect(
		useCallback(() => {
			prefetchBookings("confirmed");
		}, []),
	);

	const bookings = (bookingsData?.items ?? []) as Booking[];
	const confirmed = bookings.filter((b) => b.status === "CONFIRMED");

	const handleCardPressIn = (bookingReference: string) => {
		prefetchTicket(bookingReference);
	};

	const handleCardPress = (booking: Booking) => {
		setActiveTicket({
			bookingReference: booking.bookingReference,
			ticketToken: booking.ticketToken ?? "",
		});
	};

	return (
		<View className="flex-1 bg-background">
			{isLoading ? (
				<TicketListSkeleton />
			) : (
				<FlatList
					data={confirmed}
					keyExtractor={(item: Booking) => item.bookingReference}
					contentContainerStyle={{
						paddingHorizontal: 16,
						paddingTop: 8,
						paddingBottom: BottomTabInset + insets.bottom + 24,
					}}
					refreshControl={
						<RefreshControl
							refreshing={isFetching}
							onRefresh={refetch}
							tintColor="#ee237c"
							colors={["#ee237c"]}
						/>
					}
					renderItem={({ item }: { item: Booking }) => (
						<DigitalTicketCard
							bookingReference={item.bookingReference}
							companyName={item.companyName ?? "Moja Express"}
							origin={item.origin ?? ""}
							destination={item.destination ?? ""}
							departureTime={item.departureTime ?? ""}
							arrivalTime={item.arrivalTime ?? ""}
							seatLabel={item.seatLabel ?? "1"}
							passengerName={item.passengerName ?? "Passenger"}
							status={item.status}
							onPressIn={() => handleCardPressIn(item.bookingReference)}
							onPress={() => handleCardPress(item)}
						/>
					)}
					ListEmptyComponent={() => <TicketEmptyState />}
				/>
			)}

			<TicketSheet
				bookingReference={activeTicket?.bookingReference ?? ""}
				ticketToken={activeTicket?.ticketToken ?? ""}
				isOpen={!!activeTicket}
				onClose={() => setActiveTicket(null)}
				onCancel={() => setCancelOpen(true)}
			/>

			<CancelDialog
				isOpen={cancelOpen}
				isPending={false}
				onClose={() => setCancelOpen(false)}
				onConfirm={() => setCancelOpen(false)}
			/>
		</View>
	);
}