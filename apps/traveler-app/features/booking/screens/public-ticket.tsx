import type { DigitalTicketDTO } from "@moja/types";
import { Shield01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SubpageHeader } from "@/components/subpage-header";
import { Text } from "@/components/ui/text";
import { BottomTabInset } from "@/constants/theme";
import { useGetTicketByToken } from "@/features/booking/hooks/use-bookings";
import {
	formatDateWithWeekday,
	formatPriceXOF,
	formatTimeOnly,
} from "@/features/booking/lib/format-time";
import { formatLocationLabel } from "@/lib/format-location-label";

type PublicTicketViewProps = {
	ticketToken: string;
};

function TicketQrCode({ payload }: { payload: string }) {
	return (
		<View className="items-center justify-center rounded-2xl border border-border bg-white p-3 shadow-xs">
			<QRCode
				value={payload}
				size={200}
				backgroundColor="#ffffff"
				color="#0f172a"
				ecl="M"
			/>
		</View>
	);
}

export function PublicTicketView({ ticketToken }: PublicTicketViewProps) {
	const insets = useSafeAreaInsets();
	const { t } = useTranslation(["booking", "search"]);
	const { data: ticket, isLoading, isError, refetch } = useGetTicketByToken(
		ticketToken,
		!!ticketToken,
	);

	const renderBody = (resolved: DigitalTicketDTO) => {
		const isUrban = resolved.serviceType === "URBAN";
		const origin = formatLocationLabel({
			cityName: resolved.originCityName,
			municipalityName: resolved.originMunicipalityName,
			quarterName: resolved.originQuarterName,
			isUrban,
		});
		const destination = formatLocationLabel({
			cityName: resolved.destinationCityName,
			municipalityName: resolved.destinationMunicipalityName,
			quarterName: resolved.destinationQuarterName,
			isUrban,
		});

		return (
			<>
				<View className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex-row gap-3 items-start">
					<HugeiconsIcon icon={Shield01Icon} size={20} color="#059669" />
					<View className="flex-1 gap-1">
						<Text className="text-sm font-semibold text-emerald-900">
							{t("validTicket", { defaultValue: "Valid ticket" })}
						</Text>
						<Text className="text-xs text-emerald-800/90">
							{t("validTicketDesc", {
								defaultValue: "Present this QR code at boarding.",
							})}
						</Text>
					</View>
				</View>

				<View className="rounded-2xl border border-border bg-card p-4 gap-4">
					<View className="gap-1">
						<Text className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
							{resolved.companyName}
						</Text>
						<Text className="text-xl font-black text-foreground">
							{origin} → {destination}
						</Text>
						<Text className="text-sm text-muted-foreground">
							{formatDateWithWeekday(resolved.departureTime)} ·{" "}
							{formatTimeOnly(resolved.departureTime)}
						</Text>
					</View>

					<TicketQrCode payload={resolved.qrPayload} />

					<View className="flex-row flex-wrap gap-3">
						<View className="min-w-[45%] flex-1 gap-0.5">
							<Text className="text-xs text-muted-foreground">
								{t("passengerLabel", { defaultValue: "Passenger" })}
							</Text>
							<Text className="text-sm font-bold text-foreground">
								{resolved.passengerName}
							</Text>
						</View>
						<View className="min-w-[45%] flex-1 gap-0.5">
							<Text className="text-xs text-muted-foreground">
								{t("seatLabel", { defaultValue: "Seat" })}
							</Text>
							<Text className="text-sm font-bold text-foreground">
								{resolved.seatLabel}
							</Text>
						</View>
						<View className="min-w-[45%] flex-1 gap-0.5">
							<Text className="text-xs text-muted-foreground">
								{t("refLabel")}
							</Text>
							<Text className="text-sm font-mono font-bold text-foreground">
								{resolved.bookingReference}
							</Text>
						</View>
						<View className="min-w-[45%] flex-1 gap-0.5">
							<Text className="text-xs text-muted-foreground">
								{t("farePaid", { defaultValue: "Fare paid" })}
							</Text>
							<Text className="text-sm font-bold text-foreground">
								{formatPriceXOF(resolved.farePaidXOF)}
							</Text>
						</View>
					</View>
				</View>
			</>
		);
	};

	return (
		<View className="flex-1 bg-background">
			<SubpageHeader
				title={t("digitalTicket", { defaultValue: "Digital ticket" })}
			/>
			<ScrollView
				contentContainerStyle={{
					padding: 16,
					paddingBottom: BottomTabInset + insets.bottom + 24,
					gap: 16,
				}}
			>
				{!ticketToken ? (
					<Text className="text-center text-muted-foreground">
						{t("ticketNotFound", { defaultValue: "Ticket link is invalid." })}
					</Text>
				) : isLoading ? (
					<View className="items-center py-16">
						<ActivityIndicator size="large" color="#ee237c" />
					</View>
				) : isError || !ticket ? (
					<View className="items-center gap-4 py-16">
						<Text className="text-center text-muted-foreground">
							{t("ticketNotFound", {
								defaultValue: "Ticket not found or no longer valid.",
							})}
						</Text>
						<Pressable
							onPress={() => refetch()}
							className="rounded-full bg-primary px-4 py-2"
						>
							<Text className="text-sm font-bold text-white">
								{t("retry", { ns: "search", defaultValue: "Retry" })}
							</Text>
						</Pressable>
					</View>
				) : (
					renderBody(ticket)
				)}
			</ScrollView>
		</View>
	);
}
