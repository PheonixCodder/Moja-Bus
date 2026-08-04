import { Colors, Spacing } from "@moja/theme/tokens";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SubpageHeader } from "@/components/subpage-header";
import { Text } from "@/components/ui/text";
import { BottomTabInset } from "@/constants/theme";
import { BookingStatusBadge } from "@/features/booking/components/booking-status-badge";
import { HoldCountdown } from "@/features/booking/components/hold-countdown";
import { TripSummaryCard } from "@/features/booking/components/trip-summary-card";
import { useGetBooking } from "@/features/booking/hooks/use-bookings";

type Booking = {
	bookingReference: string;
	status: string;
	holdExpiresAt?: string;
	companyName: string;
	origin: string;
	destination: string;
	departureTime: string;
	arrivalTime: string;
	duration?: string;
	seatLabel?: string;
	farePaidXOF?: number;
	amenities?: string[];
	passengers?: Array<{
		passengerName: string;
		passengerPhone: string;
		seatLabel: string;
	}>;
};

type BookingDetailViewProps = {
	bookingReference: string;
};

export function BookingDetailView({
	bookingReference,
}: BookingDetailViewProps) {
	const insets = useSafeAreaInsets();
	const { t } = useTranslation("booking");
	const { data: booking, isLoading } = useGetBooking(bookingReference, true);

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

	if (!booking) {
		return (
			<View
				style={{
					flex: 1,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: Colors.light.background,
				}}
			>
				<Text style={{ color: Colors.light.textSecondary, fontSize: 15 }}>
					{t("bookingNotFound")}
				</Text>
			</View>
		);
	}

	return (
		<ScrollView
			style={{ flex: 1, backgroundColor: Colors.light.background }}
			contentContainerStyle={{
				paddingHorizontal: Spacing.four,
				paddingTop: Spacing.two,
				paddingBottom: BottomTabInset + insets.bottom + 24,
				gap: Spacing.three,
			}}
		>
			<SubpageHeader title={t("bookingReference")} />

			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<Text
					style={{
						fontSize: 11,
						fontWeight: "700",
						color: Colors.light.textSecondary,
						letterSpacing: 0.5,
						textTransform: "uppercase",
					}}
				>
					{t("bookingReference")}
				</Text>
				<Text
					style={{
						fontSize: 13,
						fontWeight: "600",
						color: Colors.light.textSecondary,
						fontFamily: "monospace",
					}}
				>
					{booking.bookingReference}
				</Text>
			</View>

			<BookingStatusBadge status={booking.status} />

			{booking.holdExpiresAt && booking.status === "PENDING_PAYMENT" ? (
				<HoldCountdown holdExpiresAt={booking.holdExpiresAt} />
			) : null}

			<TripSummaryCard
				companyName={booking.companyName ?? ""}
				origin={booking.origin ?? ""}
				destination={booking.destination ?? ""}
				departureTime={booking.departureTime ?? ""}
				arrivalTime={booking.arrivalTime ?? ""}
				duration={booking.duration ?? ""}
				seatLabel={booking.seatLabel}
				farePaidXOF={booking.farePaidXOF}
				amenities={booking.amenities}
				status={booking.status}
			/>

			<View>
				<Text
					style={{
						fontSize: 11,
						fontWeight: "700",
						color: Colors.light.textSecondary,
						letterSpacing: 0.5,
						textTransform: "uppercase",
						marginBottom: Spacing.two,
					}}
				>
					{t("passengers")}
				</Text>
				{(booking.passengers ?? []).map(
					(
						passenger: {
							passengerName: string;
							passengerPhone: string;
							seatLabel: string;
						},
						index: number,
					) => (
						<View
							key={index}
							style={{
								flexDirection: "row",
								alignItems: "center",
								gap: Spacing.three,
								paddingVertical: Spacing.three,
								paddingHorizontal: Spacing.four,
								backgroundColor: Colors.light.background,
								borderRadius: 12,
								borderWidth: 1,
								borderColor: Colors.light.backgroundSelected,
								marginBottom: Spacing.two,
							}}
						>
							<View
								style={{
									width: 36,
									height: 36,
									borderRadius: 18,
									backgroundColor: "rgba(238, 35, 124, 0.1)",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<Text
									style={{
										fontSize: 14,
										fontWeight: "700",
										color: Colors.light.primary,
									}}
								>
									{(passenger.passengerName ?? "?")[0]}
								</Text>
							</View>
							<View style={{ flex: 1 }}>
								<Text
									style={{
										fontSize: 14,
										fontWeight: "600",
										color: Colors.light.text,
									}}
								>
									{passenger.passengerName}
								</Text>
								<Text
									style={{
										fontSize: 12,
										color: Colors.light.textSecondary,
										marginTop: 1,
									}}
								>
									{passenger.passengerPhone}
								</Text>
							</View>
							<Text
								style={{
									fontSize: 12,
									fontWeight: "600",
									color: Colors.light.textSecondary,
								}}
							>
								{passenger.seatLabel}
							</Text>
						</View>
					),
				)}
			</View>

			{booking.farePaidXOF ? (
				<View
					style={{
						backgroundColor: Colors.light.background,
						borderRadius: 12,
						padding: Spacing.four,
						borderWidth: 1,
						borderColor: Colors.light.backgroundSelected,
					}}
				>
					<Text
						style={{
							fontSize: 11,
							fontWeight: "700",
							color: Colors.light.textSecondary,
							letterSpacing: 0.5,
							textTransform: "uppercase",
							marginBottom: Spacing.three,
						}}
					>
						{t("priceBreakdown")}
					</Text>
					<View
						style={{
							flexDirection: "row",
							justifyContent: "space-between",
							marginBottom: Spacing.two,
						}}
					>
						<Text style={{ fontSize: 13, color: Colors.light.textSecondary }}>
							{t("baseFare")}
						</Text>
						<Text
							style={{
								fontSize: 13,
								fontWeight: "600",
								color: Colors.light.text,
							}}
						>
							{booking.farePaidXOF.toLocaleString()} XOF
						</Text>
					</View>
					<View
						style={{
							flexDirection: "row",
							justifyContent: "space-between",
							paddingTop: Spacing.two,
							borderTopWidth: 1,
							borderTopColor: Colors.light.backgroundSelected,
						}}
					>
						<Text
							style={{
								fontSize: 14,
								fontWeight: "700",
								color: Colors.light.text,
							}}
						>
							{t("total")}
						</Text>
						<Text
							style={{
								fontSize: 14,
								fontWeight: "800",
								color: Colors.light.primary,
							}}
						>
							{booking.farePaidXOF.toLocaleString()} XOF
						</Text>
					</View>
				</View>
			) : null}
		</ScrollView>
	);
}
