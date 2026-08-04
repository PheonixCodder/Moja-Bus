import { Colors, Spacing } from "@moja/theme/tokens";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
	FlatList,
	Modal,
	Pressable,
	RefreshControl,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetTicket } from "@/features/booking/hooks/use-bookings";
import { DigitalTicketCard } from "@/features/booking/components/digital-ticket-card";

type TicketSheetProps = {
	bookingReference: string;
	ticketToken: string;
	isOpen: boolean;
	onClose: () => void;
	onCancel?: () => void;
};

export function TicketSheet({
	bookingReference,
	ticketToken,
	isOpen,
	onClose,
	onCancel,
}: TicketSheetProps) {
	const insets = useSafeAreaInsets();
	const { t } = useTranslation("booking");
	const hasTicket = !!bookingReference || !!ticketToken;
	const { data: ticket, isLoading, isError, refetch } = useGetTicket(
		bookingReference,
		ticketToken,
		hasTicket,
	);

	if (isLoading) {
		return (
			<Modal
				visible={isOpen}
				transparent
				animationType="slide"
				onRequestClose={onClose}
			>
				<Pressable
					style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
					onPress={onClose}
				>
					<Pressable
						style={{ flex: 1, justifyContent: "flex-end" }}
						onPress={() => {}}
					>
						<View
							style={{
								backgroundColor: Colors.light.background,
								borderTopLeftRadius: 28,
								borderTopRightRadius: 28,
								paddingTop: Spacing.five,
								paddingHorizontal: Spacing.four,
								paddingBottom: insets.bottom + 24,
								alignItems: "center",
								paddingVertical: 40,
							}}
						>
							<ActivityIndicator size="large" color={Colors.light.primary} />
						</View>
					</Pressable>
				</Pressable>
			</Modal>
		);
	}

	if (isError || !ticket) {
		return (
			<Modal
				visible={isOpen}
				transparent
				animationType="slide"
				onRequestClose={onClose}
			>
				<Pressable
					style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
					onPress={onClose}
				>
					<Pressable
						style={{ flex: 1, justifyContent: "flex-end" }}
						onPress={() => {}}
					>
						<View
							style={{
								backgroundColor: Colors.light.background,
								borderTopLeftRadius: 28,
								borderTopRightRadius: 28,
								paddingTop: Spacing.five,
								paddingHorizontal: Spacing.four,
								paddingBottom: insets.bottom + 24,
							}}
						>
							<View style={{ alignItems: "center", gap: Spacing.three }}>
								<Text style={{ color: "red", fontSize: 15 }}>
									{t("loadError")}
								</Text>
								<Pressable
									onPress={() => refetch()}
									style={{
										paddingHorizontal: 24,
										paddingVertical: 12,
										borderRadius: 12,
										backgroundColor: Colors.light.primary,
									}}
								>
									<Text style={{ color: "#fff", fontWeight: "700" }}>
										{t("retry")}
									</Text>
								</Pressable>
							</View>
						</View>
					</Pressable>
				</Pressable>
			</Modal>
		);
	}

	return (
		<Modal
			visible={isOpen}
			transparent
			animationType="slide"
			onRequestClose={onClose}
		>
			<Pressable
				style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
				onPress={onClose}
			>
				<Pressable
					style={{ flex: 1, justifyContent: "flex-end" }}
					onPress={() => {}}
				>
					<View
						style={{
							backgroundColor: Colors.light.background,
							borderTopLeftRadius: 28,
							borderTopRightRadius: 28,
							paddingTop: Spacing.five,
							paddingHorizontal: Spacing.four,
							paddingBottom: insets.bottom + 24,
						}}
					>
						<View
							style={{
								width: 40,
								height: 4,
								borderRadius: 2,
								backgroundColor: Colors.light.backgroundSelected,
								alignSelf: "center",
								marginBottom: Spacing.five,
							}}
						/>

						<Text
							style={{
								fontSize: 17,
								fontWeight: "800",
								color: Colors.light.text,
								textAlign: "center",
								marginBottom: Spacing.three,
							}}
						>
							{t("sheetTitle")}
						</Text>

						<FlatList
							data={ticket.items}
							keyExtractor={(item) => item.bookingReference}
							contentContainerStyle={{ gap: Spacing.three }}
							refreshControl={
								<RefreshControl
									refreshing={isLoading}
									onRefresh={refetch}
									tintColor={Colors.light.primary}
								/>
							}
							renderItem={({ item }) => (
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
						/>

						{onCancel ? (
							<Pressable
								onPress={onCancel}
								style={{
									paddingVertical: Spacing.two,
									alignItems: "center",
									marginTop: Spacing.three,
								}}
							>
								<Text style={{ color: "#e11d48", fontWeight: "700", fontSize: 14 }}>
									{t("cancelBooking")}
								</Text>
							</Pressable>
						) : null}
					</View>
				</Pressable>
			</Pressable>
		</Modal>
	);
}