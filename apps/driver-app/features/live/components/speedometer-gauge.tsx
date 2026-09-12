import React, { useEffect, useRef, useState } from "react";
import { View, Text } from "react-native";
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
				effectiveOverspeed ? "border-destructive" : "border-border"
			}`}
		>
			<View className="flex-row items-center justify-between w-full">
				<Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("speedometer.vehicleSpeed")}</Text>
				{effectiveOverspeed && (
					<Badge variant="error" label={t("speedometer.overspeedBadge")} />
				)}
			</View>

			<View className="flex-row items-baseline gap-1 py-1">
				<Text
					className={`text-5xl font-extrabold font-mono tracking-tighter ${
						effectiveOverspeed ? "text-destructive" : "text-foreground"
					}`}
				>
					{displaySpeed}
				</Text>
				<Text className="text-xs font-bold text-primary">km/h</Text>
			</View>

			<View className="flex-row items-center justify-around w-full pt-3 border-t border-border">
				<View className="items-center gap-0.5">
					<Text className="text-xs uppercase font-bold text-muted-foreground">{t("speedometer.heading")}</Text>
					<Text className="text-xs font-bold font-mono text-info">
						{currentLocation ? `${Math.round(currentLocation.heading)}°` : "—"}
					</Text>
				</View>

				<View className="items-center gap-0.5">
					<Text className="text-xs uppercase font-bold text-muted-foreground">{t("speedometer.altitude")}</Text>
					<Text className="text-xs font-bold font-mono text-foreground">
						{currentLocation && currentLocation.altitudeMeters
							? `${Math.round(currentLocation.altitudeMeters)}m`
							: "—"}
					</Text>
				</View>

				<View className="items-center gap-0.5">
					<Text className="text-xs uppercase font-bold text-muted-foreground">{t("speedometer.gpsSignal")}</Text>
					<Text
						className={`text-xs font-bold font-mono ${
							currentLocation?.accuracy && currentLocation.accuracy < 15
								? "text-success"
								: "text-warning"
						}`}
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
