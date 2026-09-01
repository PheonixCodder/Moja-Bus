import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
	computeSmoothedSpeed,
	evaluateOverspeedAlert,
	HIGHWAY_SPEED_LIMIT_KMH,
	type OverspeedAlertState,
} from "@/lib/telemetry-core";
import { DriverFeedback } from "@/lib/haptics";

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
	isOverspeed?: boolean;
	isActiveDriving?: boolean;
}

export function SpeedometerGauge({
	currentLocation,
	isOverspeed: externalIsOverspeed,
	isActiveDriving = true,
}: SpeedometerGaugeProps) {
	const { t } = useTranslation("live");
	const [smoothedSpeed, setSmoothedSpeed] = useState<number | null>(null);
	const overspeedStateRef = useRef<OverspeedAlertState>({
		isArmed: true,
		lastAlertTimestamp: 0,
	});

	useEffect(() => {
		if (!currentLocation) {
			setSmoothedSpeed(null);
			return;
		}

		setSmoothedSpeed((prev) => {
			const next = computeSmoothedSpeed(currentLocation.speedKmh, prev);
			if (isActiveDriving) {
				const { shouldAlert, nextState } = evaluateOverspeedAlert(
					next,
					overspeedStateRef.current,
				);
				overspeedStateRef.current = nextState;
				if (shouldAlert) {
					void DriverFeedback.overspeedAlert();
				}
			}
			return next;
		});
	}, [currentLocation?.speedKmh, isActiveDriving]);

	const effectiveOverspeed =
		externalIsOverspeed ??
		((smoothedSpeed ?? currentLocation?.speedKmh ?? 0) > HIGHWAY_SPEED_LIMIT_KMH);

	const displaySpeed =
		smoothedSpeed != null
			? Math.round(smoothedSpeed)
			: currentLocation
				? Math.round(currentLocation.speedKmh)
				: "—";

	return (
		<Card
			className={`p-5 items-center justify-center gap-2 relative overflow-hidden ${
				effectiveOverspeed ? "border-[#ef4444]" : "border-[#27272a]"
			}`}
		>
			<View style={styles.gaugeHeader}>
				<Text style={styles.gaugeLabel}>{t("speedometer.vehicleSpeed")}</Text>
				{effectiveOverspeed && (
					<Badge variant="error" label={t("speedometer.overspeedBadge")} />
				)}
			</View>

			<View style={styles.speedDisplay}>
				<Text
					style={[
						styles.speedValue,
						effectiveOverspeed && styles.speedValueOverspeed,
					]}
				>
					{displaySpeed}
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
