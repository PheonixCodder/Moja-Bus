import {
	ArrowRight01Icon,
	Cancel01Icon,
	CreditCardIcon,
	Share01Icon,
	StarIcon,
	Ticket01Icon,
	Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
	Alert,
	Modal,
	Pressable,
	ScrollView,
	TextInput,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { SubpageHeader } from "@/components/subpage-header";
import { Text } from "@/components/ui/text";
import { BottomTabInset } from "@/constants/theme";
import { BookingStatusBadge } from "@/features/booking/components/booking-status-badge";
import { HoldCountdown } from "@/features/booking/components/hold-countdown";
import {
	useCancelBooking,
	useCheckoutWithWallet,
	useInitiatePayment,
	useRefundQuote,
	useShareTicket,
	useVerifyPayment,
} from "@/features/booking/hooks/use-booking-actions";
import { useGetBooking } from "@/features/booking/hooks/use-bookings";
import { PaystackWebView } from "@/features/settings/components/paystack-webview";
import { authClient } from "@/lib/auth-client";
import { formatLocationLabel } from "@/lib/format-location-label";
import { CancelDialog } from "../components/cancel-dialog";
import { ReviewSheet } from "../components/review-sheet";
import { useHoldCountdown } from "../hooks/use-hold-countdown";
import {
	formatDateWithWeekday,
	formatPriceXOF,
	formatTimeOnly,
} from "../lib/format-time";

type BookingDetailViewProps = {
	bookingReference: string;
};

export function BookingDetailView({
	bookingReference,
}: BookingDetailViewProps) {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { t } = useTranslation(["booking", "search"]);

	const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
	const [reviewSheetOpen, setReviewSheetOpen] = useState(false);
	const [shareDialogOpen, setShareDialogOpen] = useState(false);
	const [recipientName, setRecipientName] = useState("");
	const [recipientEmail, setRecipientEmail] = useState("");
	const [authorizationUrl, setAuthorizationUrl] = useState<string | null>(null);
	const [paystackReference, setPaystackReference] = useState<string | null>(
		null,
	);
	const [isVerifying, setIsVerifying] = useState(false);

	const { data: session } = authClient.useSession();
	const {
		data: booking,
		isLoading,
		isError,
		refetch,
	} = useGetBooking(bookingReference);

	const checkoutWalletMutation = useCheckoutWithWallet();
	const cancelMutation = useCancelBooking();
	// Phase 18 (F-PS-04) — server refund quote for THIS seat's booking.
	const seatRef = booking?.seats?.[0]?.bookingReference || bookingReference;
	const { data: refundQuote } = useRefundQuote(seatRef, cancelDialogOpen);
	const initiatePayment = useInitiatePayment();
	const verifyPayment = useVerifyPayment();
	const shareTicketMutation = useShareTicket();

	const holdCountdown = useHoldCountdown(
		booking?.status === "PENDING_PAYMENT" && booking.holdExpiresAt
			? booking.holdExpiresAt.toString()
			: "",
	);
	const holdExpired =
		booking?.status === "PENDING_PAYMENT" &&
		(booking.holdExpiresAt ? holdCountdown === "Expired" : true);

	if (isLoading) {
		return (
			<View className="flex-1 items-center justify-center bg-background">
				<ActivityIndicator size="large" color="#ee237c" />
				<Text className="text-muted-foreground mt-3 text-xs font-semibold">
					{t("loading")}
				</Text>
			</View>
		);
	}

	if (isError || !booking) {
		return (
			<View className="flex-1 items-center justify-center p-6 bg-background">
				<Text className="text-foreground font-bold text-base mb-2">
					{t("bookingNotFound")}
				</Text>
				<Pressable
					onPress={() => refetch()}
					className="bg-primary px-6 py-2.5 rounded-full"
				>
					<Text className="text-white font-bold text-xs">{t("retry")}</Text>
				</Pressable>
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
	// Phase 33 (F-PS-10 D4 ruling) — completion = completedAt, NOT status:
	// BookingStatus.COMPLETED is intentionally never stamped (see schema
	// comment). This is what revives the organic Review button — it gated on
	// a value written nowhere and never rendered.
	const isCompleted = booking.completedAt != null;
	const canPay = isPending && !holdExpired;

	const handleExecuteWalletPayment = async () => {
		if (!booking.holdGroupId) return;
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		try {
			await checkoutWalletMutation.mutateAsync({ holdId: booking.holdGroupId });
			refetch();
		} catch (err: any) {
			Alert.alert(t("error"), err?.message ?? t("error"));
		}
	};

	const handleExecutePaystackPayment = async () => {
		if (!booking.holdGroupId) return;
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		try {
			const result = await initiatePayment.mutateAsync({
				holdId: booking.holdGroupId,
				payerEmail: session?.user?.email ?? undefined,
			});
			if (result.paystack?.authorizationUrl) {
				setAuthorizationUrl(result.paystack.authorizationUrl);
				setPaystackReference(result.paystack.reference ?? null);
			} else {
				Alert.alert(t("error"), t("paystackCheckout"));
			}
		} catch (err: any) {
			Alert.alert(t("error"), err?.message ?? t("error"));
		}
	};

	const handlePaystackSuccess = async (ref?: string) => {
		setAuthorizationUrl(null);
		setIsVerifying(true);
		const referenceToVerify = ref || paystackReference;
		try {
			if (referenceToVerify) {
				await verifyPayment.mutateAsync({ reference: referenceToVerify });
			}
			refetch();
		} catch (err: any) {
			Alert.alert(t("error"), err?.message ?? t("error"));
		} finally {
			setIsVerifying(false);
			setPaystackReference(null);
		}
	};

	const handlePaystackCancel = () => {
		setAuthorizationUrl(null);
		setPaystackReference(null);
	};

	const handleConfirmCancellation = async (channel: "WALLET") => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
		try {
			await cancelMutation.mutateAsync({
				bookingReference: seatRef,
				channel,
			});
			setCancelDialogOpen(false);
			refetch();
		} catch (err: any) {
			// Phase 18 (F-PS-04) — guest/eligibility failures surface honestly.
			Toast.show({
				type: "error",
				text1: t("cancelFailed"),
				text2: err?.message || undefined,
			});
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
				<SubpageHeader title={`${t("trip")} ${bookingReference}`} />

				{/* Header Status Bar */}
				<View className="bg-card border-border my-3 rounded-2xl border p-4 shadow-xs space-y-3">
					<View className="flex-row items-center justify-between">
						<View>
							<Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
								{t("busOperator", { ns: "search" })}
							</Text>
							<Text className="text-foreground text-base font-black">
								{booking.companyName}
							</Text>
						</View>
						<BookingStatusBadge status={booking.status} />
					</View>

					<View className="flex-row items-center justify-between border-t border-border/40 pt-3">
						<Text className="text-muted-foreground text-xs font-medium">
							{t("bookingReference")}
						</Text>
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
					<Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
						{t("tripDetails")}
					</Text>

					<View className="flex-row items-center justify-between">
						<View className="flex-1">
							<Text
								className="text-foreground text-lg font-black"
								numberOfLines={1}
							>
								{originFormatted}
							</Text>
							<Text
								className="text-muted-foreground text-xs font-medium"
								numberOfLines={1}
							>
								{booking.originTerminalName}
							</Text>
							<Text className="text-primary font-bold text-xs mt-1">
								{formatTimeOnly(booking.departureTime)}
							</Text>
							<Text className="text-muted-foreground text-xs">
								{formatDateWithWeekday(booking.departureTime)}
							</Text>
						</View>

						<View className="items-center px-3">
							<HugeiconsIcon
								icon={ArrowRight01Icon}
								size={18}
								color="#ee237c"
							/>
						</View>

						<View className="flex-1 items-end">
							<Text
								className="text-foreground text-right text-lg font-black"
								numberOfLines={1}
							>
								{destFormatted}
							</Text>
							<Text
								className="text-muted-foreground text-right text-xs font-medium"
								numberOfLines={1}
							>
								{booking.destinationTerminalName}
							</Text>
							<Text className="text-primary font-bold text-xs mt-1 text-right">
								{formatTimeOnly(booking.arrivalTime)}
							</Text>
							<Text className="text-muted-foreground text-xs text-right">
								{formatDateWithWeekday(booking.arrivalTime)}
							</Text>
						</View>
					</View>

					{/* Intermediate Route Stops Timeline if present */}
					{booking.stops && booking.stops.length > 0 ? (
						<View className="border-t border-border/40 pt-3 space-y-2">
							<Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
								{t("route")} ({booking.stops.length})
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
					<Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
						{t("passengers")} ({booking.seats?.length ?? 1})
					</Text>

					{(booking.seats ?? []).map((seat, index) => (
						<View
							key={seat.bookingId || index}
							className="bg-muted/30 border border-border/60 rounded-xl p-3 flex-row items-center justify-between"
						>
							<View className="flex-row items-center gap-3">
								<View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center border border-primary/20">
									<HugeiconsIcon
										icon={Ticket01Icon}
										size={16}
										color="#ee237c"
									/>
								</View>
								<View>
									<Text className="text-foreground font-bold text-xs">
										{seat.passengerName}
									</Text>
									<Text className="text-muted-foreground text-sm">
										{seat.passengerPhone}
									</Text>
								</View>
							</View>

							<View className="items-end">
								<Text className="text-primary font-black text-xs">
									{t("seatSingle", { label: seat.seatLabel })}
								</Text>
								<Text className="text-muted-foreground text-xs">
									{formatPriceXOF(seat.farePaidXOF)}
								</Text>
							</View>
						</View>
					))}
				</View>

				{/* Payment Breakdown */}
				<View className="bg-card border-border mb-3.5 rounded-2xl border p-4 shadow-xs space-y-3">
					<Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
						{t("priceBreakdown")}
					</Text>

					<View className="flex-row items-center justify-between border-b border-border/40 pb-2">
						<Text className="text-muted-foreground text-xs font-medium">
							{t("baseFare")}
						</Text>
						<Text className="text-foreground font-bold text-xs">
							{formatPriceXOF(booking.totalAmountXOF)}
						</Text>
					</View>

					<View className="flex-row items-center justify-between pt-1">
						<Text className="text-foreground font-black text-sm">
							{t("totalAmount")}
						</Text>
						<Text className="text-primary font-black text-base">
							{formatPriceXOF(booking.totalAmountXOF)}
						</Text>
					</View>
				</View>

				{/* Primary Action Buttons */}
				<View className="space-y-3 pt-2">
					{canPay ? (
						<View className="space-y-2">
							<Pressable
								onPress={handleExecuteWalletPayment}
								disabled={
									checkoutWalletMutation.isPending ||
									initiatePayment.isPending ||
									isVerifying
								}
								className="bg-primary py-4 rounded-xl items-center justify-center flex-row gap-2 shadow-sm active:opacity-90"
							>
								{checkoutWalletMutation.isPending ? (
									<ActivityIndicator size="small" color="#ffffff" />
								) : (
									<>
										<HugeiconsIcon
											icon={Wallet01Icon}
											size={18}
											color="#ffffff"
										/>
										<Text className="text-white font-black text-sm">
											{t("payWithWallet")} (
											{formatPriceXOF(booking.totalAmountXOF)})
										</Text>
									</>
								)}
							</Pressable>
							<Pressable
								onPress={handleExecutePaystackPayment}
								disabled={
									checkoutWalletMutation.isPending ||
									initiatePayment.isPending ||
									isVerifying
								}
								className="bg-slate-900 py-4 rounded-xl items-center justify-center flex-row gap-2 shadow-sm active:opacity-90"
							>
								{initiatePayment.isPending || isVerifying ? (
									<ActivityIndicator size="small" color="#ffffff" />
								) : (
									<>
										<HugeiconsIcon
											icon={CreditCardIcon}
											size={18}
											color="#ffffff"
										/>
										<Text className="text-white font-black text-sm">
											{t("payWithPaystack")}
										</Text>
									</>
								)}
							</Pressable>
						</View>
					) : null}

					{isPending && holdExpired ? (
						<Pressable
							onPress={() => router.push("/(tabs)/search" as any)}
							className="bg-muted border border-border py-3.5 rounded-xl items-center justify-center"
						>
							<Text className="text-foreground font-bold text-xs">
								{t("searchAgain")}
							</Text>
						</Pressable>
					) : null}

					{isConfirmed ? (
						<View className="space-y-2.5">
							{/* Phase 5 (F-TM-15) — live tracking is now available.
							    Show "Track Bus" button when the trip is in progress
							    (departure passed, not yet completed). The param is the
							    TRIP id (server truth). */}
							{booking.completedAt == null &&
								booking.departureTime.getTime() <= Date.now() &&
								booking.arrivalTime.getTime() > Date.now() && (
									<Pressable
										onPress={() =>
											router.push(`/tracking/${booking.tripId}` as any)
										}
										className="bg-primary/20 border border-primary/30 py-3 rounded-xl items-center justify-center flex-row gap-2"
									>
										<View className="size-2 rounded-full bg-primary animate-ping" />
										<Text className="text-primary font-bold text-xs">
											Track Live Bus
										</Text>
									</Pressable>
								)}

							<View className="flex-row gap-3">
								<Pressable
									onPress={() => router.push("/(tabs)/tickets" as any)}
									className="flex-1 bg-primary py-3.5 rounded-xl items-center justify-center flex-row gap-2 shadow-xs"
								>
									<HugeiconsIcon
										icon={Ticket01Icon}
										size={16}
										color="#ffffff"
									/>
									<Text className="text-white font-bold text-xs">
										{t("viewTicket")}
									</Text>
								</Pressable>

								{/* P2-3 👻 → wired: email the digital-ticket link (17C.4). */}
								<Pressable
									onPress={() => setShareDialogOpen(true)}
									className="bg-muted border border-border px-4 py-3.5 rounded-xl items-center justify-center flex-row gap-1.5"
								>
									<HugeiconsIcon icon={Share01Icon} size={15} color="#0f172a" />
									<Text className="text-foreground font-bold text-xs">
										{t("shareTicket")}
									</Text>
								</Pressable>

								<Pressable
									onPress={() => setCancelDialogOpen(true)}
									className="bg-destructive/10 border border-destructive/20 px-4 py-3.5 rounded-xl items-center justify-center flex-row gap-1.5"
								>
									<HugeiconsIcon
										icon={Cancel01Icon}
										size={16}
										color="#ef4444"
									/>
									<Text className="text-destructive font-bold text-xs">
										{t("cancel")}
									</Text>
								</Pressable>
							</View>
						</View>
					) : null}

					{isCompleted ? (
						<Pressable
							onPress={() => setReviewSheetOpen(true)}
							className="bg-primary/10 border border-primary/20 py-3.5 rounded-xl items-center justify-center flex-row gap-2 shadow-xs"
						>
							<HugeiconsIcon icon={StarIcon} size={16} color="#ee237c" />
							<Text className="text-primary font-bold text-xs">
								{t("reviewTrip")}
							</Text>
						</Pressable>
					) : null}
				</View>
			</ScrollView>

			{/* Cancel Refund Dialog */}
			<CancelDialog
				isOpen={cancelDialogOpen}
				farePaidXOF={booking.totalAmountXOF}
				refundAmountXOF={
					refundQuote?.cancellable ? refundQuote.refundAmountXOF : null
				}
				notCancellable={refundQuote ? !refundQuote.cancellable : false}
				isPending={cancelMutation.isPending}
				onClose={() => setCancelDialogOpen(false)}
				onConfirm={handleConfirmCancellation}
			/>

			{/* Share Ticket Dialog (P2-3 👻 → wired, 17C.4) */}
			<Modal
				visible={shareDialogOpen}
				transparent
				animationType="fade"
				onRequestClose={() => setShareDialogOpen(false)}
			>
				<Pressable
					className="flex-1 bg-black/50 justify-center px-6"
					onPress={() => setShareDialogOpen(false)}
				>
					<Pressable
						className="bg-white rounded-2xl p-5 gap-3"
						onPress={(e) => e.stopPropagation()}
					>
						<Text className="text-foreground font-black text-base">
							{t("shareTicket")}
						</Text>
						<Text className="text-muted-foreground text-xs leading-4">
							{t("shareTicketDesc")}
						</Text>
						<TextInput
							value={recipientName}
							onChangeText={setRecipientName}
							placeholder={t("recipientName")}
							placeholderTextColor="#94a3b8"
							className="border border-border rounded-xl px-3 py-2.5 text-foreground text-sm"
						/>
						<TextInput
							value={recipientEmail}
							onChangeText={setRecipientEmail}
							placeholder={t("recipientEmail")}
							placeholderTextColor="#94a3b8"
							autoCapitalize="none"
							keyboardType="email-address"
							className="border border-border rounded-xl px-3 py-2.5 text-foreground text-sm"
						/>
						<View className="flex-row gap-2 pt-1">
							<Pressable
								onPress={() => setShareDialogOpen(false)}
								className="flex-1 border border-border rounded-xl py-2.5 items-center"
							>
								<Text className="text-foreground font-bold text-xs">
									{t("cancel")}
								</Text>
							</Pressable>
							<Pressable
								disabled={
									shareTicketMutation.isPending ||
									recipientName.trim().length < 2 ||
									!recipientEmail.includes("@")
								}
								onPress={() => {
									shareTicketMutation.mutate(
										{
											bookingReference,
											recipientName: recipientName.trim(),
											recipientEmail: recipientEmail.trim(),
										},
										{
											onSuccess: () => {
												setShareDialogOpen(false);
												setRecipientName("");
												setRecipientEmail("");
												Haptics.notificationAsync(
													Haptics.NotificationFeedbackType.Success,
												).catch(() => {});
												Alert.alert(
													t("shared", { name: recipientName.trim() }),
												);
											},
											onError: () => Alert.alert(t("shareFailed")),
										},
									);
								}}
								className="flex-1 bg-primary rounded-xl py-2.5 items-center"
							>
								{shareTicketMutation.isPending ? (
									<ActivityIndicator size="small" color="#ffffff" />
								) : (
									<Text className="text-white font-bold text-xs">
										{t("send")}
									</Text>
								)}
							</Pressable>
						</View>
					</Pressable>
				</Pressable>
			</Modal>

			{/* Review Sheet Modal */}
			<ReviewSheet
				visible={reviewSheetOpen}
				bookingId={booking.seats?.[0]?.bookingId || ""}
				companyId={booking.companyId}
				onClose={() => setReviewSheetOpen(false)}
			/>

			<PaystackWebView
				authorizationUrl={authorizationUrl ?? ""}
				reference={paystackReference ?? undefined}
				visible={!!authorizationUrl}
				onSuccess={handlePaystackSuccess}
				onCancel={handlePaystackCancel}
			/>
		</View>
	);
}
