import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SubpageHeader } from "@/components/subpage-header";
import { Text } from "@/components/ui/text";
import { BottomTabInset } from "@/constants/theme";
import { BookingStatusBadge } from "@/features/booking/components/booking-status-badge";
import { HoldCountdown } from "@/features/booking/components/hold-countdown";
import { TripSummaryCard } from "@/features/booking/components/trip-summary-card";
import { useGetBooking } from "@/features/booking/hooks/use-bookings";
import { useCheckoutWithWallet, useCancelBooking } from "@/features/booking/hooks/use-booking-actions";
import { formatLocationLabel } from "@/lib/format-location-label";
import { formatDateWithWeekday, formatPriceXOF, formatTimeOnly } from "../lib/format-time";
import { TicketSheet } from "../components/ticket-sheet";
import { CancelDialog } from "../components/cancel-dialog";
import { ReviewSheet } from "./review-sheet";
import {
  ArrowRight01Icon,
  Bus01Icon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  Location01Icon,
  StarIcon,
  Ticket01Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as Haptics from "expo-haptics";

type BookingDetailViewProps = {
	bookingReference: string;
};

export function BookingDetailView({
	bookingReference,
}: BookingDetailViewProps) {
	const insets = useSafeAreaInsets();
	const { data: booking, isLoading, refetch } = useGetBooking(bookingReference, true);

	const checkoutWalletMutation = useCheckoutWithWallet();
	const cancelMutation = useCancelBooking();

	const [ticketSheetOpen, setTicketSheetOpen] = useState(false);
	const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
	const [reviewSheetOpen, setReviewSheetOpen] = useState(false);
	const [paymentMethod, setPaymentMethod] = useState<"WALLET" | "PAYSTACK">("WALLET");

	if (isLoading) {
		return (
			<View className="flex-1 items-center justify-center bg-background">
				<ActivityIndicator size="large" color="#ee237c" />
				<Text className="text-muted-foreground mt-3 text-xs font-semibold">
					Loading trip details...
				</Text>
			</View>
		);
	}

	if (!booking) {
		return (
			<View className="flex-1 items-center justify-center bg-background p-6">
				<Text className="text-muted-foreground text-sm font-semibold">
					Booking reference not found.
				</Text>
			</View>
		);
	}

	const isUrban = booking.serviceType === "URBAN";
	const originFormatted = formatLocationLabel({
		cityName: booking.originCityName,
		municipalityName: booking.originMunicipalityName,
		quarterName: booking.originQuarterName,
		isUrban,
	});

	const destFormatted = formatLocationLabel({
		cityName: booking.destinationCityName,
		municipalityName: booking.destinationMunicipalityName,
		quarterName: booking.destinationQuarterName,
		isUrban,
	});

	const isPending = booking.status === "PENDING_PAYMENT";
	const isConfirmed = booking.status === "CONFIRMED";
	const isCompleted = booking.status === "COMPLETED";

	const handleExecuteWalletPayment = async () => {
		if (!booking.holdGroupId) return;
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		try {
			await checkoutWalletMutation.mutateAsync({ holdId: booking.holdGroupId });
			refetch();
		} catch (err: any) {
			console.error("Wallet checkout error:", err);
		}
	};

	const handleConfirmCancellation = async (channel: "WALLET") => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
		try {
			await cancelMutation.mutateAsync({
				bookingReference: booking.seats?.[0]?.bookingReference || bookingReference,
				channel,
			});
			setCancelDialogOpen(false);
			refetch();
		} catch (err: any) {
			console.error("Cancellation error:", err);
		}
	};

	return (
		<View className="flex-1 bg-background">
			<ScrollView
				className="flex-1"
				contentContainerStyle={{
					paddingHorizontal: 16,
					paddingTop: 8,
					paddingBottom: BottomTabInset + insets.bottom + 32,
				}}
			>
				<SubpageHeader title={`Booking ${bookingReference}`} />

				{/* Header Status Bar */}
				<View className="bg-card border-border my-3 rounded-2xl border p-4 shadow-xs space-y-3">
					<View className="flex-row items-center justify-between">
						<View>
							<Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
								Company / Operator
							</Text>
							<Text className="text-foreground text-base font-black">
								{booking.companyName}
							</Text>
						</View>
						<BookingStatusBadge status={booking.status} />
					</View>

					<View className="flex-row items-center justify-between border-t border-border/40 pt-3">
						<Text className="text-muted-foreground text-xs font-medium">Reference Code</Text>
						<Text className="text-foreground font-mono font-bold text-xs">
							{bookingReference}
						</Text>
					</View>
				</View>

				{/* Hold Expiration Countdown if Pending */}
				{isPending && booking.holdExpiresAt ? (
					<View className="mb-3">
						<HoldCountdown holdExpiresAt={booking.holdExpiresAt.toString()} />
					</View>
				) : null}

				{/* Trip Journey Card */}
				<View className="bg-card border-border mb-3.5 rounded-2xl border p-4 shadow-xs space-y-4">
					<Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
						Journey Overview
					</Text>

					<View className="flex-row items-center justify-between">
						<View className="flex-1">
							<Text className="text-foreground text-lg font-black" numberOfLines={1}>
								{originFormatted}
							</Text>
							<Text className="text-muted-foreground text-xs font-medium" numberOfLines={1}>
								{booking.originTerminalName}
							</Text>
							<Text className="text-primary font-bold text-xs mt-1">
								{formatTimeOnly(booking.departureTime)}
							</Text>
							<Text className="text-muted-foreground text-[10px]">
								{formatDateWithWeekday(booking.departureTime)}
							</Text>
						</View>

						<View className="items-center px-3">
							<HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#ee237c" />
						</View>

						<View className="flex-1 items-end">
							<Text className="text-foreground text-right text-lg font-black" numberOfLines={1}>
								{destFormatted}
							</Text>
							<Text className="text-muted-foreground text-right text-xs font-medium" numberOfLines={1}>
								{booking.destinationTerminalName}
							</Text>
							<Text className="text-primary font-bold text-xs mt-1 text-right">
								{formatTimeOnly(booking.arrivalTime)}
							</Text>
							<Text className="text-muted-foreground text-[10px] text-right">
								{formatDateWithWeekday(booking.arrivalTime)}
							</Text>
						</View>
					</View>

					{/* Intermediate Route Stops Timeline if present */}
					{booking.stops && booking.stops.length > 0 ? (
						<View className="border-t border-border/40 pt-3 space-y-2">
							<Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
								Route Stops ({booking.stops.length})
							</Text>
							<View className="space-y-1.5 pl-2">
								{booking.stops.map((stop, idx) => (
									<View key={idx} className="flex-row items-center gap-2">
										<View className="w-2 h-2 rounded-full bg-primary/60" />
										<Text className="text-foreground text-xs font-semibold">
											{stop.terminalName} ({stop.cityName})
										</Text>
									</View>
								))}
							</View>
						</View>
					) : null}
				</View>

				{/* Passenger Seats Breakdown */}
				<View className="bg-card border-border mb-3.5 rounded-2xl border p-4 shadow-xs space-y-3">
					<Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
						Passenger & Seat Breakdown ({booking.seats?.length ?? 1})
					</Text>

					{(booking.seats ?? []).map((seat, index) => (
						<View
							key={seat.bookingId || index}
							className="bg-muted/30 border border-border/60 rounded-xl p-3 flex-row items-center justify-between"
						>
							<View className="flex-row items-center gap-3">
								<View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center border border-primary/20">
									<HugeiconsIcon icon={Ticket01Icon} size={16} color="#ee237c" />
								</View>
								<View>
									<Text className="text-foreground font-bold text-xs">
										{seat.passengerName}
									</Text>
									<Text className="text-muted-foreground text-[11px]">
										{seat.passengerPhone}
									</Text>
								</View>
							</View>

							<View className="items-end">
								<Text className="text-primary font-black text-xs">
									Seat {seat.seatLabel}
								</Text>
								<Text className="text-muted-foreground text-[10px]">
									{formatPriceXOF(seat.farePaidXOF)}
								</Text>
							</View>
						</View>
					))}
				</View>

				{/* Payment Breakdown */}
				<View className="bg-card border-border mb-3.5 rounded-2xl border p-4 shadow-xs space-y-3">
					<Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
						Payment Breakdown
					</Text>

					<View className="flex-row items-center justify-between border-b border-border/40 pb-2">
						<Text className="text-muted-foreground text-xs font-medium">Total Fare</Text>
						<Text className="text-foreground font-bold text-xs">
							{formatPriceXOF(booking.totalAmountXOF)}
						</Text>
					</View>

					<View className="flex-row items-center justify-between pt-1">
						<Text className="text-foreground font-black text-sm">Total Paid</Text>
						<Text className="text-primary font-black text-base">
							{formatPriceXOF(booking.totalAmountXOF)}
						</Text>
					</View>
				</View>

				{/* Primary Action Buttons */}
				<View className="space-y-3 pt-2">
					{isPending ? (
						<View className="space-y-2">
							<Pressable
								onPress={handleExecuteWalletPayment}
								disabled={checkoutWalletMutation.isPending}
								className="bg-primary py-4 rounded-xl items-center justify-center flex-row gap-2 shadow-sm active:opacity-90"
							>
								{checkoutWalletMutation.isPending ? (
									<ActivityIndicator size="small" color="#ffffff" />
								) : (
									<>
										<HugeiconsIcon icon={Wallet01Icon} size={18} color="#ffffff" />
										<Text className="text-white font-black text-sm">
											Pay with Wallet ({formatPriceXOF(booking.totalAmountXOF)})
										</Text>
									</>
								)}
							</Pressable>
						</View>
					) : null}

					{isConfirmed ? (
						<View className="flex-row gap-3">
							<Pressable
								onPress={() => setTicketSheetOpen(true)}
								className="flex-1 bg-primary py-3.5 rounded-xl items-center justify-center flex-row gap-2 shadow-xs"
							>
								<HugeiconsIcon icon={Ticket01Icon} size={16} color="#ffffff" />
								<Text className="text-white font-bold text-xs">View Ticket QR</Text>
							</Pressable>

							<Pressable
								onPress={() => setCancelDialogOpen(true)}
								className="bg-destructive/10 border border-destructive/20 px-4 py-3.5 rounded-xl items-center justify-center flex-row gap-1.5"
							>
								<HugeiconsIcon icon={Cancel01Icon} size={16} color="#ef4444" />
								<Text className="text-destructive font-bold text-xs">Cancel</Text>
							</Pressable>
						</View>
					) : null}

					{isCompleted ? (
						<Pressable
							onPress={() => setReviewSheetOpen(true)}
							className="bg-primary/10 border border-primary/20 py-3.5 rounded-xl items-center justify-center flex-row gap-2 shadow-xs"
						>
							<HugeiconsIcon icon={StarIcon} size={16} color="#ee237c" />
							<Text className="text-primary font-bold text-xs">Leave a Trip Review</Text>
						</Pressable>
					) : null}
				</View>
			</ScrollView>

			{/* Ticket Sheet */}
			<TicketSheet
				bookingReference={bookingReference}
				ticketToken={booking.seats?.[0]?.ticketToken || ""}
				isOpen={ticketSheetOpen}
				onClose={() => setTicketSheetOpen(false)}
				onCancel={() => {
					setTicketSheetOpen(false);
					setCancelDialogOpen(true);
				}}
			/>

			{/* Cancel Refund Dialog */}
			<CancelDialog
				isOpen={cancelDialogOpen}
				farePaidXOF={booking.totalAmountXOF}
				isPending={cancelMutation.isPending}
				onClose={() => setCancelDialogOpen(false)}
				onConfirm={handleConfirmCancellation}
			/>

			{/* Review Sheet Modal */}
			<ReviewSheet
				visible={reviewSheetOpen}
				bookingId={booking.seats?.[0]?.bookingId || ""}
				onClose={() => setReviewSheetOpen(false)}
			/>
		</View>
	);
}
