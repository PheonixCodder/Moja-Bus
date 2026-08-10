import type { DigitalTicketDTO } from "@moja/types";
import {
  Cancel01Icon,
  QrCodeIcon,
  Share01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as Haptics from "expo-haptics";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Share,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Rect } from "react-native-svg";
import { Text } from "@/components/ui/text";
import { formatLocationLabel } from "@/lib/format-location-label";
import { useGetTicket } from "@/features/booking/hooks/use-bookings";
import { formatDateWithWeekday, formatPriceXOF, formatTimeOnly } from "../lib/format-time";

type TicketSheetProps = {
	bookingReference: string;
	ticketToken: string;
	isOpen: boolean;
	onClose: () => void;
	onCancel?: () => void;
};

// Generates a deterministic SVG barcode pattern from the token
function VectorQrPlaceholder({ payload }: { payload: string }) {
	const size = 180;
	const count = 15;
	const cellSize = size / count;

	// Deterministic pattern generator based on char codes of payload
	const cells: Array<{ row: number; col: number }> = [];
	for (let r = 0; r < count; r++) {
		for (let c = 0; c < count; c++) {
			// Always draw corner finder pattern blocks
			const isTopLeft = r < 4 && c < 4;
			const isTopRight = r < 4 && c >= count - 4;
			const isBottomLeft = r >= count - 4 && c < 4;
			if (isTopLeft || isTopRight || isBottomLeft) {
				if (
					(r === 0 || r === 3 || c === 0 || c === 3) ||
					(r === 1 && c === 1) || (r === 1 && c === 2) || (r === 2 && c === 1) || (r === 2 && c === 2)
				) {
					cells.push({ row: r, col: c });
				}
				continue;
			}
			const charCode = payload.charCodeAt((r * count + c) % payload.length) || 65;
			if ((charCode + r * 7 + c * 13) % 3 === 0) {
				cells.push({ row: r, col: c });
			}
		}
	}

	return (
		<View className="items-center justify-center p-3 bg-white rounded-2xl border border-border shadow-xs">
			<Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
				<Rect width={size} height={size} fill="#ffffff" rx={8} />
				{cells.map((cell) => (
					<Rect
						key={`${cell.row}-${cell.col}`}
						x={cell.col * cellSize}
						y={cell.row * cellSize}
						width={cellSize - 0.5}
						height={cellSize - 0.5}
						fill="#0f172a"
						rx={1}
					/>
				))}
			</Svg>
		</View>
	);
}

export function TicketSheet({
	bookingReference,
	ticketToken,
	isOpen,
	onClose,
	onCancel,
}: TicketSheetProps) {
	const insets = useSafeAreaInsets();
	const hasTicket = !!bookingReference || !!ticketToken;
	const { data: ticket, isLoading, isError, refetch } = useGetTicket(
		bookingReference,
		ticketToken,
		hasTicket && isOpen,
	);

	const handleShare = async () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		if (!ticket) return;
		try {
			await Share.share({
				title: `Boarding Pass - ${ticket.bookingReference}`,
				message: `Moja Bus Boarding Pass\nRef: ${ticket.bookingReference}\nPassenger: ${ticket.passengerName}\nSeat: ${ticket.seatLabel}\nView online: ${ticket.qrPayload}`,
				url: ticket.qrPayload,
			});
		} catch (err) {
			console.error("Failed to share ticket:", err);
		}
	};

	if (!isOpen) return null;

	return (
		<Modal
			visible={isOpen}
			transparent
			animationType="slide"
			onRequestClose={onClose}
		>
			<View className="flex-1 justify-end bg-black/60">
				<Pressable className="absolute inset-0" onPress={onClose} />

				<View
					className="bg-background rounded-t-3xl border-t border-border overflow-hidden max-h-[90%]"
					style={{ paddingBottom: insets.bottom + 16 }}
				>
					{/* Modal Handle & Header */}
					<View className="items-center pt-3 pb-2 border-b border-border/40 px-4">
						<View className="w-10 h-1.5 rounded-full bg-muted-foreground/30 mb-3" />

						<View className="w-full flex-row items-center justify-between">
							<View>
								<Text className="text-foreground text-lg font-black tracking-tight">
									Digital Boarding Pass
								</Text>
								<Text className="text-muted-foreground font-mono text-xs">
									REF: {bookingReference || ticket?.bookingReference}
								</Text>
							</View>

							<Pressable
								onPress={handleShare}
								className="bg-primary/10 border-primary/20 flex-row items-center gap-1.5 rounded-full border px-3 py-1.5"
							>
								<HugeiconsIcon icon={Share01Icon} size={14} color="#ee237c" />
								<Text className="text-primary text-xs font-bold">Share</Text>
							</Pressable>
						</View>
					</View>

					{/* Body Content */}
					<ScrollView className="p-4 space-y-4">
						{isLoading ? (
							<View className="py-16 items-center justify-center">
								<ActivityIndicator size="large" color="#ee237c" />
								<Text className="text-muted-foreground mt-3 text-xs font-semibold">
									Loading ticket details...
								</Text>
							</View>
						) : isError || !ticket ? (
							<View className="py-12 items-center space-y-3">
								<Text className="text-destructive font-bold text-sm">
									Failed to load ticket details
								</Text>
								<Pressable
									onPress={() => refetch()}
									className="bg-primary px-6 py-2.5 rounded-xl"
								>
									<Text className="text-white font-bold text-xs">Retry</Text>
								</Pressable>
							</View>
						) : (
							<View className="space-y-4 pb-4">
								{/* QR Instructions Banner */}
								<View className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 flex-row items-center gap-2">
									<HugeiconsIcon icon={QrCodeIcon} size={18} color="#10b981" />
									<Text className="text-emerald-700 text-xs font-semibold flex-1 leading-snug">
										Present this QR code to the driver or terminal operator during boarding.
									</Text>
								</View>

								{/* QR Code Container */}
								<View className="items-center py-2">
									<VectorQrPlaceholder payload={ticket.qrPayload || ticket.ticketToken} />
									<Text className="text-muted-foreground font-mono text-[11px] mt-2 tracking-wider">
										TOKEN: {ticket.ticketToken}
									</Text>
								</View>

								{/* Ticket Summary Card */}
								<View className="bg-card border-border rounded-2xl border p-4 space-y-3">
									<View className="flex-row items-center justify-between border-b border-border/40 pb-3">
										<View>
											<Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
												Operator
											</Text>
											<Text className="text-foreground font-black text-sm">
												{ticket.companyName}
											</Text>
										</View>
										<View className="items-end">
											<Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
												Fare Paid
											</Text>
											<Text className="text-primary font-black text-sm">
												{formatPriceXOF(ticket.farePaidXOF)}
											</Text>
										</View>
									</View>

									{/* Route Details */}
									<View className="flex-row items-center justify-between">
										<View className="flex-1">
											<Text className="text-muted-foreground text-[10px] font-bold uppercase">
												Boarding
											</Text>
											<Text className="text-foreground font-extrabold text-sm" numberOfLines={1}>
												{formatLocationLabel({
													cityName: ticket.originCityName,
													municipalityName: ticket.originMunicipalityName,
													quarterName: ticket.originQuarterName,
													isUrban: ticket.serviceType === 'URBAN',
												})}
											</Text>
											<Text className="text-muted-foreground text-[11px]" numberOfLines={1}>
												{ticket.originTerminalName}
											</Text>
											<Text className="text-primary font-bold text-xs mt-1">
												{formatTimeOnly(ticket.departureTime)}
											</Text>
											<Text className="text-muted-foreground text-[10px]">
												{formatDateWithWeekday(ticket.departureTime)}
											</Text>
										</View>

										<View className="flex-1 items-end">
											<Text className="text-muted-foreground text-[10px] font-bold uppercase text-right">
												Dropoff
											</Text>
											<Text className="text-foreground font-extrabold text-sm text-right" numberOfLines={1}>
												{formatLocationLabel({
													cityName: ticket.destinationCityName,
													municipalityName: ticket.destinationMunicipalityName,
													quarterName: ticket.destinationQuarterName,
													isUrban: ticket.serviceType === 'URBAN',
												})}
											</Text>
											<Text className="text-muted-foreground text-[11px] text-right" numberOfLines={1}>
												{ticket.destinationTerminalName}
											</Text>
											<Text className="text-primary font-bold text-xs mt-1 text-right">
												{formatTimeOnly(ticket.arrivalTime)}
											</Text>
											<Text className="text-muted-foreground text-[10px] text-right">
												{formatDateWithWeekday(ticket.arrivalTime)}
											</Text>
										</View>
									</View>

									{/* Passenger & Seat Info */}
									<View className="flex-row items-center justify-between border-t border-border/40 pt-3">
										<View>
											<Text className="text-muted-foreground text-[10px] font-bold uppercase">
												Passenger
											</Text>
											<Text className="text-foreground font-bold text-xs">
												{ticket.passengerName}
											</Text>
										</View>
										<View className="items-end">
											<Text className="text-muted-foreground text-[10px] font-bold uppercase">
												Seat Number
											</Text>
											<Text className="text-primary font-black text-xs">
												Seat {ticket.seatLabel}
											</Text>
										</View>
									</View>
								</View>

								{/* Cancel & Refund Trigger */}
								{onCancel ? (
									<Pressable
										onPress={onCancel}
										className="bg-destructive/10 border border-destructive/20 rounded-xl p-3.5 items-center justify-center flex-row gap-2 mt-2"
									>
										<HugeiconsIcon icon={Cancel01Icon} size={16} color="#ef4444" />
										<Text className="text-destructive font-bold text-xs">
											Cancel Booking & Request Refund
										</Text>
									</Pressable>
								) : null}
							</View>
						)}
					</ScrollView>
				</View>
			</View>
		</Modal>
	);
}