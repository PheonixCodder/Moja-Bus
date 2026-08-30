import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
	Bus01Icon,
	Time02Icon,
	UserGroupIcon,
	PlayIcon,
} from "@hugeicons/core-free-icons";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { colors } from "@/constants/theme";

interface TripCardProps {
	assignmentId: string;
	trip: any;
	passengerCount: number;
	role: string;
	onStartTrip: (tripId: string) => void;
	isStarting?: boolean;
}

export function TripCard({
	assignmentId,
	trip,
	passengerCount,
	role,
	onStartTrip,
	isStarting,
}: TripCardProps) {
	const { t } = useTranslation("trips");
	const router = useRouter();
	const stops = trip.tripStops ?? [];
	const originStop = stops[0]?.terminal?.name ?? t("defaultOriginTerminal");
	const destStop = stops[stops.length - 1]?.terminal?.name ?? t("defaultDestTerminal");
	const depTime = new Date(trip.departureDate).toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});

	return (
		<Card key={assignmentId} className="p-5 gap-4">
			{/* Top Bus & Status Header */}
			<View style={styles.cardHeader}>
				<View style={styles.busInfoRow}>
					<View style={styles.busIconWrap}>
						<HugeiconsIcon icon={Bus01Icon} size={20} color={colors.primary.rose} />
					</View>
					<View>
						<Text style={styles.busPlate}>
							{trip.bus?.registrationPlate ?? t("noBusAssigned")}
						</Text>
						<Text style={styles.busSub}>
							{trip.company?.name ?? t("noCarrier")} • {role}
						</Text>
					</View>
				</View>

				<Badge
					variant={trip.status === "BOARDING" || trip.status === "DEPARTED" ? "brand" : "default"}
					label={trip.status}
				/>
			</View>

			{/* Route Timeline */}
			<View style={styles.timelineBox}>
				<View style={styles.timelineStop}>
					<View style={[styles.dot, { backgroundColor: "#10b981" }]} />
					<Text style={styles.stopName} numberOfLines={1}>
						{originStop}
					</Text>
				</View>
				<View style={styles.timelineLine} />
				<View style={styles.timelineStop}>
					<View style={[styles.dot, { backgroundColor: "#ee237c" }]} />
					<Text style={styles.stopName} numberOfLines={1}>
						{destStop}
					</Text>
				</View>
			</View>

			{/* Metadata: Departure Time & Passenger Count */}
			<View style={styles.metaRow}>
				<View style={styles.metaItem}>
					<HugeiconsIcon icon={Time02Icon} size={15} color="#a1a1aa" />
					<Text style={styles.metaText}>
						{t("departureLabel", { time: depTime })}
					</Text>
				</View>
				<View style={styles.metaItem}>
					<HugeiconsIcon icon={UserGroupIcon} size={15} color="#a1a1aa" />
					<Text style={styles.metaText}>
						{t("passengersLabel", { count: passengerCount, total: trip.totalSeats })}
					</Text>
				</View>
			</View>

			{/* Actions */}
			<View style={styles.actionsRow}>
				<Button
					title={t("btnManifest")}
					variant="outline"
					size="md"
					onPress={() => router.push(`/trip/${trip.id}/manifest`)}
					className="flex-1"
				/>

				{trip.status !== "ARRIVED" && (
					<Button
						title={trip.status === "DEPARTED" ? t("btnResume") : t("btnStart")}
						variant="primary"
						size="md"
						loading={isStarting}
						onPress={() => onStartTrip(trip.id)}
						icon={<HugeiconsIcon icon={PlayIcon} size={16} color="#ffffff" />}
						className="flex-1"
					/>
				)}
			</View>
		</Card>
	);
}

const styles = StyleSheet.create({
	cardHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		borderBottomWidth: 1,
		borderBottomColor: "#27272a",
		paddingBottom: 12,
	},
	busInfoRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	busIconWrap: {
		padding: 8,
		borderRadius: 12,
		backgroundColor: "rgba(238, 35, 124, 0.1)",
		borderWidth: 1,
		borderColor: "rgba(238, 35, 124, 0.2)",
	},
	busPlate: {
		fontFamily: "monospace",
		fontWeight: "700",
		fontSize: 14,
		color: "#fafafa",
	},
	busSub: {
		fontSize: 11,
		color: "#a1a1aa",
	},
	timelineBox: {
		gap: 8,
		backgroundColor: "#09090b",
		padding: 14,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "#27272a",
	},
	timelineStop: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	dot: {
		width: 10,
		height: 10,
		borderRadius: 5,
	},
	stopName: {
		fontSize: 14,
		fontWeight: "700",
		color: "#fafafa",
		flex: 1,
	},
	timelineLine: {
		width: 2,
		height: 12,
		backgroundColor: "#27272a",
		marginLeft: 4,
	},
	metaRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		backgroundColor: "rgba(9, 9, 11, 0.6)",
		paddingHorizontal: 14,
		paddingVertical: 10,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#27272a",
	},
	metaItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	metaText: {
		fontSize: 12,
		fontWeight: "600",
		color: "#d4d4d8",
	},
	actionsRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingTop: 4,
	},
});
