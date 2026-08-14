import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabInset } from "@/constants/theme";
import { CancelDialog } from "@/features/booking/components/cancel-dialog";
import { DigitalTicketCard } from "@/features/booking/components/digital-ticket-card";
import { TicketEmptyState } from "@/features/booking/components/ticket-empty-state";
import { TicketListSkeleton } from "@/features/booking/components/ticket-list-skeleton";
import { TicketSheet } from "@/features/booking/components/ticket-sheet";
import { TICKETS_LIST_LIMIT } from "@/features/booking/constants/query-keys";
import { useBookingPrefetch } from "@/features/booking/hooks/use-booking-prefetch";
import {
	type PassengerBookingSummary,
	useListMyBookings,
} from "@/features/booking/hooks/use-bookings";
import { useCancelBooking } from "@/features/booking/hooks/use-booking-actions";
import { formatLocationLabel } from "@/lib/format-location-label";
import * as Haptics from "expo-haptics";

type TicketItem = {
	bookingReference: string;
	ticketToken: string;
	companyName: string;
	origin: string;
	originSub?: string;
	destination: string;
	destinationSub?: string;
	departureTime: Date;
	arrivalTime: Date;
	seatLabel: string;
	passengerName: string;
	farePaidXOF: number;
	status: string;
};

export function TicketsView() {
	const insets = useSafeAreaInsets();
	const { prefetchTicketsList, prefetchTicket } = useBookingPrefetch();
	const cancelMutation = useCancelBooking();

	const [activeTicket, setActiveTicket] = useState<{
		bookingReference: string;
		ticketToken: string;
		farePaidXOF?: number;
	} | null>(null);
	const [cancelOpen, setCancelOpen] = useState(false);

	const {
		data: bookingsData,
		isLoading,
		isFetching,
		refetch,
	} = useListMyBookings("upcoming", TICKETS_LIST_LIMIT, 0, true);

	useFocusEffect(
		useCallback(() => {
			prefetchTicketsList();
		}, [prefetchTicketsList]),
	);

	const bookings = (bookingsData?.items ?? []) as PassengerBookingSummary[];
	const confirmedBookings = bookings.filter((b) => b.status === "CONFIRMED");

	// Flatten all seats across confirmed bookings into individual ticket cards
	const ticketItems: TicketItem[] = confirmedBookings.flatMap((booking) => {
		const isUrban = booking.serviceType === "URBAN";
		const origin = formatLocationLabel({
			cityName: booking.originCityName,
			municipalityName: booking.originMunicipalityName,
			quarterName: booking.originQuarterName,
			isUrban,
		});
		const destination = formatLocationLabel({
			cityName: booking.destinationCityName,
			municipalityName: booking.destinationMunicipalityName,
			quarterName: booking.destinationQuarterName,
			isUrban,
		});

		return (booking.seats ?? []).map((seat) => ({
			bookingReference: seat.bookingReference,
			ticketToken: seat.ticketToken,
			companyName: booking.companyName,
			origin,
			originSub: booking.originTerminalName,
			destination,
			destinationSub: booking.destinationTerminalName,
			departureTime: booking.departureTime,
			arrivalTime: booking.arrivalTime,
			seatLabel: seat.seatLabel,
			passengerName: seat.passengerName,
			farePaidXOF: seat.farePaidXOF,
			status: booking.status,
		}));
	});

	const handleCardPressIn = (bookingReference: string) => {
		prefetchTicket(bookingReference);
	};

	const handleCardPress = (ticket: TicketItem) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		setActiveTicket({
			bookingReference: ticket.bookingReference,
			ticketToken: ticket.ticketToken,
			farePaidXOF: ticket.farePaidXOF,
		});
	};

	const handleConfirmCancel = async (channel: "WALLET") => {
		if (!activeTicket) return;
		try {
			await cancelMutation.mutateAsync({
				bookingReference: activeTicket.bookingReference,
				channel,
			});
			setCancelOpen(false);
			setActiveTicket(null);
			refetch();
		} catch (err) {
			console.error("Failed to cancel ticket:", err);
		}
	};

	return (
		<View className="flex-1 bg-background">
			{isLoading ? (
				<TicketListSkeleton />
			) : (
				<FlatList
					data={ticketItems}
					keyExtractor={(item: TicketItem) => item.ticketToken || item.bookingReference}
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
					renderItem={({ item }: { item: TicketItem }) => (
						<DigitalTicketCard
							bookingReference={item.bookingReference}
							companyName={item.companyName}
							origin={item.origin}
							originSub={item.originSub}
							destination={item.destination}
							destinationSub={item.destinationSub}
							departureTime={item.departureTime}
							arrivalTime={item.arrivalTime}
							seatLabel={item.seatLabel}
							passengerName={item.passengerName}
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
				farePaidXOF={activeTicket?.farePaidXOF}
				isPending={cancelMutation.isPending}
				onClose={() => setCancelOpen(false)}
				onConfirm={handleConfirmCancel}
			/>
		</View>
	);
}