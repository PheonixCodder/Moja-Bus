import { Colors, Spacing } from "@moja/theme/tokens";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
	FlatList,
	RefreshControl,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SubpageHeader } from "@/components/subpage-header";
import { Text } from "@/components/ui/text";
import { BottomTabInset } from "@/constants/theme";
import { DigitalTicketCard } from "@/features/booking/components/digital-ticket-card";
import { useListMyBookings } from "@/features/booking/hooks/use-bookings";

export function TicketsView() {
	const insets = useSafeAreaInsets();
	const { t } = useTranslation("booking");
	const { data, isLoading, refetch, isFetching } = useListMyBookings(
		"confirmed",
		50,
		0,
		true,
	);

	type TicketItem = {
		bookingReference: string;
		status: string;
		companyName: string;
		origin: string;
		destination: string;
		departureTime: string;
		arrivalTime: string;
		seatLabel: string;
		passengerName: string;
	};

	const allItems = (data?.items ?? []) as TicketItem[];
	const tickets = allItems.filter((item) => item.status === "CONFIRMED");

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
			<SubpageHeader title={t("tickets")} />

			<FlatList
				data={tickets}
				keyExtractor={(item: TicketItem) => item.bookingReference}
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
				renderItem={({ item }: { item: TicketItem }) => (
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
							{t("noTickets")}
						</Text>
					</View>
				)}
			/>
		</View>
	);
}
