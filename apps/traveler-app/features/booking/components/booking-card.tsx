import {
	Calendar01Icon,
	ClockIcon,
	Location01Icon,
	Ticket01Icon,
	UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Colors, Spacing } from "@moja/theme/tokens";
import { View } from "react-native";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";

type BookingStatus =
	| "CONFIRMED"
	| "PENDING_PAYMENT"
	| "COMPLETED"
	| "CANCELLED"
	| "EXPIRED";

type BookingCardProps = {
	bookingReference: string;
	status: BookingStatus;
	origin: string;
	destination: string;
	departureTime: string;
	arrivalTime: string;
	seatLabel?: string;
	farePaidXOF?: number;
	_holdExpiresAt?: string;
	_onPress: () => void;
};

const STATUS_COLORS: Record<BookingStatus, string> = {
	CONFIRMED: "#10b981",
	PENDING_PAYMENT: "#f59e0b",
	COMPLETED: "#3b82f6",
	CANCELLED: "#ef4444",
	EXPIRED: "#9ca3af",
};

function formatDate(dateStr: string): string {
	const date = new Date(dateStr);
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function BookingCard({
	bookingReference,
	status,
	origin,
	destination,
	departureTime,
	arrivalTime,
seatLabel,
  farePaidXOF,
}: BookingCardProps) {
	const statusColor = STATUS_COLORS[status] ?? "#9ca3af";

	return (
		<View
			style={{
				backgroundColor: Colors.light.background,
				borderRadius: 16,
				padding: Spacing.four,
				borderWidth: 1,
				borderColor: Colors.light.backgroundSelected,
				marginBottom: Spacing.three,
				shadowColor: "#000",
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.04,
				shadowRadius: 8,
				elevation: 2,
			}}
		>
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					marginBottom: Spacing.three,
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
							width: 10,
							height: 10,
							borderRadius: 5,
							backgroundColor: statusColor,
						}}
					/>
					<Text
						style={{
							fontSize: 12,
							fontWeight: "700",
							color: statusColor,
							textTransform: "uppercase",
							letterSpacing: 0.5,
						}}
					>
						{status.replace("_", " ")}
					</Text>
				</View>
				<Text
					style={{
						fontSize: 11,
						fontWeight: "500",
						color: Colors.light.textSecondary,
						fontFamily: "monospace",
					}}
				>
					{bookingReference}
				</Text>
			</View>

			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					gap: Spacing.two,
					marginBottom: Spacing.three,
				}}
			>
				<View style={{ flex: 1 }}>
					<Text
						style={{
							fontSize: 16,
							fontWeight: "700",
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
						{formatDate(departureTime)}
					</Text>
				</View>

				<View
					style={{
						alignItems: "center",
						paddingHorizontal: Spacing.two,
					}}
				>
					<HugeiconsIcon
						icon={Location01Icon}
						size={16}
						color={Colors.light.primary}
					/>
				</View>

				<View style={{ flex: 1, alignItems: "flex-end" }}>
					<Text
						style={{
							fontSize: 16,
							fontWeight: "700",
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
						{formatDate(arrivalTime)}
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
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						gap: Spacing.two,
					}}
				>
					<HugeiconsIcon
						icon={Ticket01Icon}
						size={14}
						color={Colors.light.textSecondary}
					/>
					{seatLabel ? (
						<Text
							style={{
								fontSize: 12,
								fontWeight: "600",
								color: Colors.light.textSecondary,
							}}
						>
							Seat {seatLabel}
						</Text>
					) : null}
				</View>

				{farePaidXOF ? (
					<Text
						style={{
							fontSize: 14,
							fontWeight: "700",
							color: Colors.light.primary,
						}}
					>
						{farePaidXOF.toLocaleString()} XOF
					</Text>
				) : null}
			</View>
		</View>
	);
}
