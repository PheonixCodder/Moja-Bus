import { Colors, Spacing } from "@moja/theme/tokens";
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
import { Text } from "@/components/ui/text";
import { BottomTabInset } from "@/constants/theme";
import { CancelDialog } from "@/features/booking/components/cancel-dialog";
import { DigitalTicketCard } from "@/features/booking/components/digital-ticket-card";
import { TicketSheet } from "@/features/booking/components/ticket-sheet";
import { useListMyBookings } from "@/features/booking/hooks/use-bookings";
import type { Booking } from "@/features/booking/hooks/use-bookings";

export function TicketsView() {
	const insets = useSafeAreaInsets();
	const { t } = useTranslation("booking");
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

	const bookings = (bookingsData?.items ?? []) as Booking[];
	const confirmed = bookings.filter((b) => b.status === "CONFIRMED");

	if (isLoading) {
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
			<FlatList
				data={confirmed}
				keyExtractor={(item: Booking) => item.bookingReference}
				numColumns={2}
				contentContainerStyle={{
					paddingHorizontal: Spacing.four,
					paddingTop: Spacing.two,
					paddingBottom: BottomTabInset + insets.bottom + 24,
					gap: Spacing.three,
				}}
				refreshControl={
					<RefreshControl
						refreshing={isFetching}
						onRefresh={refetch}
						tintColor={Colors.light.primary}
					/>
				}
				renderItem={({ item }: { item: Booking }) => (
					<Pressable
						key={item.bookingReference}
						onPress={() =>
							setActiveTicket({
								bookingReference: item.bookingReference,
								ticketToken: item.ticketToken ?? "",
							})
						}
						style={({ pressed }) => ({
							flex: 1,
							minWidth: "48%",
							opacity: pressed ? 0.7 : 1,
						})}
					>
						<DigitalTicketCard
							bookingReference={item.bookingReference}
							companyName={item.companyName ?? ""}
							origin={item.origin ?? ""}
							destination={item.destination ?? ""}
							departureTime={item.departureTime ?? ""}
							arrivalTime={item.arrivalTime ?? ""}
							seatLabel={item.seatLabel ?? ""}
							passengerName={item.passengerName ?? ""}
							status={item.status}
							compact
							onPress={() =>
								setActiveTicket({
									bookingReference: item.bookingReference,
									ticketToken: item.ticketToken ?? "",
								})
							}
						/>
					</Pressable>
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
							{t("noTickets")}
						</Text>
					</View>
				)}
			/>

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