import type { DigitalTicketDTO } from "@moja/types";
import {
  Cancel01Icon,
  QrCodeIcon,
  Share01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Share,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

/** Same payload shape as web: APP_URL/tickets/{ticketToken} (or bare token fallback). */
function TicketQrCode({ payload }: { payload: string }) {
	return (
		<View className="items-center justify-center rounded-2xl border border-border bg-white p-3 shadow-xs">
			<QRCode
				value={payload}
				size={180}
				backgroundColor="#ffffff"
				color="#0f172a"
				ecl="M"
			/>
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
	const { t } = useTranslation(["booking", "search"]);
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
									{t("boardingPassTitle", "Digital Boarding Pass")}
								</Text>
								<Text className="text-muted-foreground font-mono text-xs">
									{t("refLabel")} {bookingReference || ticket?.bookingReference}
								</Text>
							</View>

							<Pressable
								onPress={handleShare}
								className="bg-primary/10 border-primary/20 flex-row items-center gap-1.5 rounded-full border px-3 py-1.5"
							>
								<HugeiconsIcon icon={Share01Icon} size={14} color="#ee237c" />
								<Text className="text-primary text-xs font-bold">{t("shareTicket")}</Text>
							</Pressable>
						</View>
					</View>

					{/* Body Content */}
					<ScrollView className="p-4 space-y-4">
						{isLoading ? (
							<View className="py-16 items-center justify-center">
								<ActivityIndicator size="large" color="#ee237c" />
								<Text className="text-muted-foreground mt-3 text-xs font-semibold">
									{t("loading")}
								</Text>
							</View>
						) : isError || !ticket ? (
							<View className="py-12 items-center space-y-3">
								<Text className="text-destructive font-bold text-sm">
									{t("loadError")}
								</Text>
								<Pressable
									onPress={() => refetch()}
									className="bg-primary px-6 py-2.5 rounded-xl"
								>
									<Text className="text-white font-bold text-xs">{t("retry")}</Text>
								</Pressable>
							</View>
						) : (
							<View className="space-y-4 pb-4">
								{/* QR Instructions Banner */}
								<View className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 flex-row items-center gap-2">
									<HugeiconsIcon icon={QrCodeIcon} size={18} color="#10b981" />
									<Text className="text-emerald-700 text-xs font-semibold flex-1 leading-snug">
										{t("qrInstructions")}
									</Text>
								</View>

								{/* QR Code — encodes qrPayload URL (same as web) for operator scanners */}
								<View className="items-center py-2">
									<TicketQrCode payload={ticket.qrPayload || ticket.ticketToken} />
									{/* Phase 32 (F-PS-15) — the caption shows the booking
									    reference, NOT the raw durable bearer token: the QR
									    itself already carries the credential, and printing
									    it in text turned every screenshot/share into a
									    permanent-credential leak. The token remains encoded,
									    scannable, and intentionally shareable via the Share
									    button — just not passively readable. */}
									<Text className="text-muted-foreground font-mono text-sm mt-2 tracking-wider">
										{ticket.bookingReference}
									</Text>
								</View>

								{/* Ticket Summary Card */}
								<View className="bg-card border-border rounded-2xl border p-4 space-y-3">
									<View className="flex-row items-center justify-between border-b border-border/40 pb-3">
										<View>
											<Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
												{t("busOperator", { ns: "search" })}
											</Text>
											<Text className="text-foreground font-black text-sm">
												{ticket.companyName}
											</Text>
										</View>
										<View className="items-end">
											<Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
												{t("farePaid")}
											</Text>
											<Text className="text-primary font-black text-sm">
												{formatPriceXOF(ticket.farePaidXOF)}
											</Text>
										</View>
									</View>

									{/* Route Details */}
									<View className="flex-row items-center justify-between">
										<View className="flex-1">
											<Text className="text-muted-foreground text-xs font-bold uppercase">
												{t("departure")}
											</Text>
											<Text className="text-foreground font-extrabold text-sm" numberOfLines={1}>
												{formatLocationLabel({
													cityName: ticket.originCityName,
													municipalityName: ticket.originMunicipalityName,
													quarterName: ticket.originQuarterName,
													isUrban: ticket.serviceType === 'URBAN',
												})}
											</Text>
											<Text className="text-muted-foreground text-sm" numberOfLines={1}>
												{ticket.originTerminalName}
											</Text>
											<Text className="text-primary font-bold text-xs mt-1">
												{formatTimeOnly(ticket.departureTime)}
											</Text>
											<Text className="text-muted-foreground text-xs">
												{formatDateWithWeekday(ticket.departureTime)}
											</Text>
										</View>

										<View className="flex-1 items-end">
											<Text className="text-muted-foreground text-xs font-bold uppercase text-right">
												{t("destination")}
											</Text>
											<Text className="text-foreground font-extrabold text-sm text-right" numberOfLines={1}>
												{formatLocationLabel({
													cityName: ticket.destinationCityName,
													municipalityName: ticket.destinationMunicipalityName,
													quarterName: ticket.destinationQuarterName,
													isUrban: ticket.serviceType === 'URBAN',
												})}
											</Text>
											<Text className="text-muted-foreground text-sm text-right" numberOfLines={1}>
												{ticket.destinationTerminalName}
											</Text>
											<Text className="text-primary font-bold text-xs mt-1 text-right">
												{formatTimeOnly(ticket.arrivalTime)}
											</Text>
											<Text className="text-muted-foreground text-xs text-right">
												{formatDateWithWeekday(ticket.arrivalTime)}
											</Text>
										</View>
									</View>

									{/* Passenger & Seat Info */}
									<View className="flex-row items-center justify-between border-t border-border/40 pt-3">
										<View>
											<Text className="text-muted-foreground text-xs font-bold uppercase">
												{t("passenger")}
											</Text>
											<Text className="text-foreground font-bold text-xs">
												{ticket.passengerName}
											</Text>
										</View>
										<View className="items-end">
											<Text className="text-muted-foreground text-xs font-bold uppercase">
												{t("seatLabel")}
											</Text>
											<Text className="text-primary font-black text-xs">
												{t("seatSingle", { label: ticket.seatLabel })}
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
											{t("cancelBooking")}
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