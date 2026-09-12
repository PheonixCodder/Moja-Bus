import React from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
	Bus01Icon,
	Time02Icon,
	UserGroupIcon,
	PlayIcon,
	QrCode01Icon,
	Navigation03Icon,
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
	onTakeOverTrip?: (tripId: string) => void;
	isTakingOver?: boolean;
}

export function TripCard({
	assignmentId,
	trip,
	passengerCount,
	role,
	onStartTrip,
	isStarting,
	onTakeOverTrip,
	isTakingOver,
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

	const isDriverRole = role === "PRIMARY" || role === "RELIEF";
	const isDeparted = trip.status === "DEPARTED";
	const isBoardable =
		trip.status === "SCHEDULED" ||
		trip.status === "BOARDING" ||
		trip.status === "DELAYED";

	const handleOpenBoardingScanner = () => {
		router.push({
			pathname: "/(tabs)/scanner",
			params: { tripId: trip.id },
		});
	};

	return (
		<Card key={assignmentId} className="p-5 gap-4">
			{/* Top Bus & Status Header */}
			<View className="flex-row items-center justify-between border-b border-border pb-3">
				<View className="flex-row items-center gap-2.5">
					<View className="p-2 rounded-xl bg-primary/10 border border-primary/20">
						<HugeiconsIcon icon={Bus01Icon} size={20} color={colors.primary.rose} />
					</View>
					<View>
						<Text className="font-mono font-bold text-sm text-foreground">
							{trip.bus?.registrationPlate ?? t("noBusAssigned")}
						</Text>
						<Text className="text-xs text-muted-foreground">
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
			<View className="gap-2 bg-background p-3.5 rounded-2xl border border-border">
				<View className="flex-row items-center gap-2.5">
					<View className="size-2.5 rounded-full bg-success" />
					<Text className="text-sm font-bold text-foreground flex-1" numberOfLines={1}>
						{originStop}
					</Text>
				</View>
				<View className="w-0.5 h-3 bg-border ml-1" />
				<View className="flex-row items-center gap-2.5">
					<View className="size-2.5 rounded-full bg-primary" />
					<Text className="text-sm font-bold text-foreground flex-1" numberOfLines={1}>
						{destStop}
					</Text>
				</View>
			</View>

			{/* Metadata: Departure Time & Passenger Count */}
			<View className="flex-row items-center justify-between bg-card-elevated px-3.5 py-2.5 rounded-xl border border-border">
				<View className="flex-row items-center gap-1.5">
					<HugeiconsIcon icon={Time02Icon} size={15} color={colors.neutral.textSecondary} />
					<Text className="text-xs font-semibold text-foreground/80">
						{t("departureLabel", { time: depTime })}
					</Text>
				</View>
				<View className="flex-row items-center gap-1.5">
					<HugeiconsIcon icon={UserGroupIcon} size={15} color={colors.neutral.textSecondary} />
					<Text className="text-xs font-semibold text-foreground/80">
						{t("passengersLabel", { count: passengerCount, total: trip.totalSeats })}
					</Text>
				</View>
			</View>

			{/* Actions Row */}
			<View className="w-full gap-2 pt-1">
				<View className="flex-row items-center gap-2.5">
					<Button
						title={t("btnManifest")}
						variant="outline"
						size="md"
						onPress={() => router.push(`/trip/${trip.id}/manifest`)}
						className="flex-1"
					/>

					{(isBoardable || isDeparted) && (
						<Button
							title={t("btnBoarding")}
							variant="secondary"
							size="md"
							onPress={handleOpenBoardingScanner}
							icon={<HugeiconsIcon icon={QrCode01Icon} size={16} color={colors.neutral.textPrimary} />}
							className="flex-1"
						/>
					)}

					{isDeparted && role === "RELIEF" && (
						<Button
							title={t("btnTakeOver")}
							variant="primary"
							size="md"
							loading={isTakingOver}
							onPress={() => onTakeOverTrip?.(trip.id)}
							icon={<HugeiconsIcon icon={Navigation03Icon} size={16} color={colors.neutral.textPrimary} />}
							className="flex-1"
						/>
					)}

					{isDeparted && role === "PRIMARY" && (
						<Button
							title={t("btnResume")}
							variant="primary"
							size="md"
							onPress={() => router.push("/(tabs)/live")}
							icon={<HugeiconsIcon icon={Navigation03Icon} size={16} color={colors.neutral.textPrimary} />}
							className="flex-1"
						/>
					)}

					{isBoardable && role === "PRIMARY" && (
						<Button
							title={t("btnStart")}
							variant="primary"
							size="md"
							loading={isStarting}
							onPress={() => onStartTrip(trip.id)}
							icon={<HugeiconsIcon icon={PlayIcon} size={16} color={colors.neutral.textPrimary} />}
							className="flex-1"
						/>
					)}
				</View>
			</View>
		</Card>
	);
}
