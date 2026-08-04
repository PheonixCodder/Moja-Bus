import {
	QrCodeIcon,
	Shield01Icon,
	Ticket01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Colors, Spacing } from "@moja/theme/tokens";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";

type DigitalTicketCardProps = {
	bookingReference: string;
	companyName: string;
	origin: string;
	destination: string;
	departureTime: string;
	arrivalTime: string;
	seatLabel: string;
	passengerName: string;
	status?: string;
	compact?: boolean;
	onPress?: () => void;
};

export function DigitalTicketCard({
	bookingReference,
	companyName,
	origin,
	destination,
	departureTime,
	arrivalTime,
	seatLabel,
	passengerName,
	status,
	compact = false,
	onPress,
}: DigitalTicketCardProps) {
	if (compact) {
		const content = (
			<View
				style={{
					backgroundColor: Colors.light.background,
					borderRadius: 12,
					padding: Spacing.three,
					borderWidth: 1,
					borderColor: Colors.light.backgroundSelected,
					flexDirection: "row",
					alignItems: "center",
					gap: Spacing.three,
				}}
			>
				<View
					style={{
						width: 40,
						height: 40,
						borderRadius: 10,
						backgroundColor: "rgba(238, 35, 124, 0.1)",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<HugeiconsIcon
						icon={Ticket01Icon}
						size={20}
						color={Colors.light.primary}
					/>
				</View>
				<View style={{ flex: 1 }}>
					<Text
						style={{
							fontSize: 13,
							fontWeight: "700",
							color: Colors.light.text,
						}}
					>
						{origin} → {destination}
					</Text>
					<Text
						style={{
							fontSize: 11,
							color: Colors.light.textSecondary,
							marginTop: 2,
						}}
					>
						{departureTime} · Seat {seatLabel}
					</Text>
				</View>
				{status ? (
					<Text
						style={{
							fontSize: 10,
							fontWeight: "700",
							color:
								status === "CONFIRMED"
									? "#10b981"
									: status === "CANCELLED"
										? "#ef4444"
										: "#9ca3af",
							textTransform: "uppercase",
						}}
					>
						{status}
					</Text>
				) : null}
			</View>
		);
		return onPress ? (
			<Pressable onPress={onPress}>{content}</Pressable>
		) : (
			content
		);
	}

	return (
		<View
			style={{
				backgroundColor: Colors.light.background,
				borderRadius: 20,
				padding: Spacing.four,
				borderWidth: 2,
				borderColor: Colors.light.primary,
				gap: Spacing.three,
			}}
		>
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						gap: Spacing.two,
					}}
				>
					<View
						style={{
							width: 36,
							height: 36,
							borderRadius: 10,
							backgroundColor: "rgba(238, 35, 124, 0.1)",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<HugeiconsIcon
							icon={Ticket01Icon}
							size={18}
							color={Colors.light.primary}
						/>
					</View>
					<View>
						<Text
							style={{
								fontSize: 14,
								fontWeight: "800",
								color: Colors.light.text,
							}}
						>
							{companyName}
						</Text>
						<Text
							style={{
								fontSize: 11,
								color: Colors.light.textSecondary,
								marginTop: 1,
							}}
						>
							{bookingReference}
						</Text>
					</View>
				</View>

				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						gap: 4,
						paddingHorizontal: 8,
						paddingVertical: 4,
						borderRadius: 100,
						backgroundColor: "rgba(16, 185, 129, 0.1)",
					}}
				>
					<HugeiconsIcon icon={Shield01Icon} size={12} color="#10b981" />
					<Text
						style={{
							fontSize: 9,
							fontWeight: "800",
							letterSpacing: 1,
							color: "#10b981",
							textTransform: "uppercase",
						}}
					>
						Valid
					</Text>
				</View>
			</View>

			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<View>
					<Text
						style={{
							fontSize: 11,
							fontWeight: "700",
							color: Colors.light.textSecondary,
							letterSpacing: 0.5,
							textTransform: "uppercase",
						}}
					>
						From
					</Text>
					<Text
						style={{
							fontSize: 16,
							fontWeight: "800",
							color: Colors.light.text,
						}}
					>
						{origin}
					</Text>
					<Text
						style={{
							fontSize: 12,
							color: Colors.light.textSecondary,
							marginTop: 2,
						}}
					>
						{departureTime}
					</Text>
				</View>

				<View style={{ alignItems: "center" }}>
					<HugeiconsIcon
						icon={QrCodeIcon}
						size={40}
						color={Colors.light.primary}
					/>
					<Text
						style={{
							fontSize: 8,
							fontWeight: "600",
							color: Colors.light.textSecondary,
							marginTop: 4,
						}}
					>
						TICKET
					</Text>
				</View>

				<View style={{ alignItems: "flex-end" }}>
					<Text
						style={{
							fontSize: 11,
							fontWeight: "700",
							color: Colors.light.textSecondary,
							letterSpacing: 0.5,
							textTransform: "uppercase",
						}}
					>
						To
					</Text>
					<Text
						style={{
							fontSize: 16,
							fontWeight: "800",
							color: Colors.light.text,
						}}
					>
						{destination}
					</Text>
					<Text
						style={{
							fontSize: 12,
							color: Colors.light.textSecondary,
							marginTop: 2,
						}}
					>
						{arrivalTime}
					</Text>
				</View>
			</View>

			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					paddingTop: Spacing.three,
					borderTopWidth: 1,
					borderTopColor: Colors.light.backgroundSelected,
				}}
			>
				<View>
					<Text
						style={{
							fontSize: 10,
							fontWeight: "600",
							color: Colors.light.textSecondary,
							letterSpacing: 0.5,
							textTransform: "uppercase",
						}}
					>
						Passenger
					</Text>
					<Text
						style={{
							fontSize: 13,
							fontWeight: "600",
							color: Colors.light.text,
							marginTop: 2,
						}}
					>
						{passengerName}
					</Text>
				</View>

				<View>
					<Text
						style={{
							fontSize: 10,
							fontWeight: "600",
							color: Colors.light.textSecondary,
							letterSpacing: 0.5,
							textTransform: "uppercase",
						}}
					>
						Seat
					</Text>
					<Text
						style={{
							fontSize: 13,
							fontWeight: "700",
							color: Colors.light.primary,
							marginTop: 2,
						}}
					>
						{seatLabel}
					</Text>
				</View>
			</View>
		</View>
	);
}
