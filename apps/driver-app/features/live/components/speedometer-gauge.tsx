import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export interface LiveLocationData {
	latitude: number;
	longitude: number;
	heading: number;
	speedKmh: number;
	accuracy?: number;
	altitudeMeters?: number;
}

interface SpeedometerGaugeProps {
	currentLocation: LiveLocationData | null;
	isOverspeed: boolean;
}

export function SpeedometerGauge({
	currentLocation,
	isOverspeed,
}: SpeedometerGaugeProps) {
	const { t } = useTranslation("live");
	return (
		<Card
			className={`p-5 items-center justify-center gap-2 relative overflow-hidden ${
				isOverspeed ? "border-[#ef4444]" : "border-[#27272a]"
			}`}
		>
			<View style={styles.gaugeHeader}>
				<Text style={styles.gaugeLabel}>{t("speedometer.vehicleSpeed")}</Text>
				{isOverspeed && (
					<Badge variant="error" label={t("speedometer.overspeedBadge")} />
				)}
			</View>

			<View style={styles.speedDisplay}>
				<Text
					style={[
						styles.speedValue,
						isOverspeed && styles.speedValueOverspeed,
					]}
				>
					{currentLocation ? Math.round(currentLocation.speedKmh) : "—"}
				</Text>
				<Text style={styles.speedUnit}>km/h</Text>
			</View>

			<View style={styles.instrumentGrid}>
				<View style={styles.instrumentItem}>
					<Text style={styles.instrumentLabel}>{t("speedometer.heading")}</Text>
					<Text style={styles.headingValue}>
						{currentLocation ? `${Math.round(currentLocation.heading)}°` : "—"}
					</Text>
				</View>

				<View style={styles.instrumentItem}>
					<Text style={styles.instrumentLabel}>{t("speedometer.altitude")}</Text>
					<Text style={styles.altitudeValue}>
						{currentLocation && currentLocation.altitudeMeters
							? `${Math.round(currentLocation.altitudeMeters)}m`
							: "—"}
					</Text>
				</View>

				<View style={styles.instrumentItem}>
					<Text style={styles.instrumentLabel}>{t("speedometer.gpsSignal")}</Text>
					<Text
						style={[
							styles.signalValue,
							currentLocation?.accuracy && currentLocation.accuracy < 15
								? styles.signalGood
								: styles.signalFair,
						]}
					>
						{currentLocation?.accuracy
							? `±${Math.round(currentLocation.accuracy)}m`
							: t("speedometer.acquiring")}
					</Text>
				</View>
			</View>
		</Card>
	);
}

const styles = StyleSheet.create({
	gaugeHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		width: "100%",
	},
	gaugeLabel: {
		fontSize: 10,
		fontWeight: "700",
		color: "#71717a",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	speedDisplay: {
		flexDirection: "row",
		alignItems: "baseline",
		gap: 4,
		paddingVertical: 4,
	},
	speedValue: {
		fontSize: 52,
		fontWeight: "800",
		fontFamily: "monospace",
		color: "#fafafa",
		letterSpacing: -1,
	},
	speedValueOverspeed: {
		color: "#ef4444",
	},
	speedUnit: {
		fontSize: 12,
		fontWeight: "700",
		color: "#ee237c",
	},
	instrumentGrid: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-around",
		width: "100%",
		paddingTop: 12,
		borderTopWidth: 1,
		borderTopColor: "#27272a",
	},
	instrumentItem: {
		alignItems: "center",
		gap: 2,
	},
	instrumentLabel: {
		fontSize: 10,
		textTransform: "uppercase",
		color: "#71717a",
		fontWeight: "700",
	},
	headingValue: {
		fontSize: 12,
		fontWeight: "700",
		color: "#60a5fa",
		fontFamily: "monospace",
	},
	altitudeValue: {
		fontSize: 12,
		fontWeight: "700",
		color: "#fafafa",
		fontFamily: "monospace",
	},
	signalValue: {
		fontSize: 12,
		fontWeight: "700",
		fontFamily: "monospace",
	},
	signalGood: {
		color: "#10b981",
	},
	signalFair: {
		color: "#fbbf24",
	},
});
