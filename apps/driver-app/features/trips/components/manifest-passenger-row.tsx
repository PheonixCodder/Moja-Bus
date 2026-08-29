import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
	CheckmarkCircle02Icon,
	Call02Icon,
	CircleIcon,
} from "@hugeicons/core-free-icons";
import { Card } from "@/components/ui/Card";

export interface ManifestPassenger {
	bookingId: string;
	passengerName: string;
	passengerPhone?: string | null;
	seatNumber: string | number;
	bookingReference: string;
	originTerminal?: string | null;
	boardedAt?: string | Date | null;
}

interface ManifestPassengerRowProps {
	passenger: ManifestPassenger;
	onToggleBoarding: (bookingId: string, isBoarded: boolean) => void;
	onCallPassenger: (phone?: string | null) => void;
	isUpdating?: boolean;
}

export function ManifestPassengerRow({
	passenger,
	onToggleBoarding,
	onCallPassenger,
	isUpdating,
}: ManifestPassengerRowProps) {
	const isBoarded = !!passenger.boardedAt;

	return (
		<Card className="p-3.5 flex-row items-center justify-between">
			{/* Left: Seat Number Badge & Passenger Details */}
			<View style={styles.leftInfo}>
				<View style={styles.seatBadge}>
					<Text style={styles.seatNumber}>{passenger.seatNumber}</Text>
				</View>

				<View style={styles.detailsWrap}>
					<Text style={styles.passengerName} numberOfLines={1}>
						{passenger.passengerName}
					</Text>
					<View style={styles.metaRow}>
						<Text style={styles.bookingRef}>{passenger.bookingReference}</Text>
						{passenger.originTerminal && (
							<Text style={styles.originText} numberOfLines={1}>
								• {passenger.originTerminal}
							</Text>
						)}
					</View>
				</View>
			</View>

			{/* Right Actions: Phone Call & Boarding Checkbox */}
			<View style={styles.actionsRow}>
				{passenger.passengerPhone && (
					<TouchableOpacity
						onPress={() => onCallPassenger(passenger.passengerPhone)}
						activeOpacity={0.8}
						style={styles.callBtn}
					>
						<HugeiconsIcon icon={Call02Icon} size={16} color="#38bdf8" />
					</TouchableOpacity>
				)}

				<TouchableOpacity
					onPress={() => onToggleBoarding(passenger.bookingId, isBoarded)}
					disabled={isUpdating || isBoarded}
					activeOpacity={0.8}
					style={[
						styles.checkboxBtn,
						isBoarded ? styles.checkboxBoarded : styles.checkboxPending,
					]}
				>
					{isBoarded ? (
						<HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} color="#10b981" />
					) : (
						<HugeiconsIcon icon={CircleIcon} size={20} color="#71717a" />
					)}
				</TouchableOpacity>
			</View>
		</Card>
	);
}

const styles = StyleSheet.create({
	leftInfo: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		flex: 1,
		marginRight: 8,
	},
	seatBadge: {
		width: 44,
		height: 44,
		borderRadius: 14,
		backgroundColor: "#09090b",
		borderWidth: 1,
		borderColor: "#27272a",
		alignItems: "center",
		justifyContent: "center",
	},
	seatNumber: {
		fontSize: 13,
		fontFamily: "monospace",
		fontWeight: "800",
		color: "#ee237c",
	},
	detailsWrap: {
		flex: 1,
		gap: 2,
	},
	passengerName: {
		fontSize: 14,
		fontWeight: "700",
		color: "#fafafa",
	},
	metaRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	bookingRef: {
		fontSize: 11,
		color: "#a1a1aa",
		fontFamily: "monospace",
	},
	originText: {
		fontSize: 10,
		color: "#71717a",
	},
	actionsRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	callBtn: {
		width: 40,
		height: 40,
		borderRadius: 12,
		backgroundColor: "#18181b",
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "#27272a",
	},
	checkboxBtn: {
		width: 40,
		height: 40,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
	},
	checkboxBoarded: {
		backgroundColor: "rgba(16, 185, 129, 0.15)",
		borderColor: "rgba(16, 185, 129, 0.3)",
	},
	checkboxPending: {
		backgroundColor: "#09090b",
		borderColor: "#27272a",
	},
});
