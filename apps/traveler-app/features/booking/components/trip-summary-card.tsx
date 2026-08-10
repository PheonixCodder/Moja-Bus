import {
	AirplaneSeatIcon,
	Calendar01Icon,
	ClockIcon,
	Location01Icon,
	MapPinIcon,
	MoneyIcon,
	Shield01Icon,
	UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Colors, Spacing } from "@moja/theme/tokens";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { formatDateWithWeekday, formatTimeOnly } from "../lib/format-time";

type TripSummaryCardProps = {
	companyName: string;
	companyLogo?: string;
	origin: string;
	destination: string;
	departureTime: string;
	arrivalTime: string;
	duration: string;
	seatLabel?: string;
	farePaidXOF?: number;
	amenities?: string[];
	status?: string;
	onPressRouteMap?: () => void;
};

export function TripSummaryCard({
	companyName,
	companyLogo,
	origin,
	destination,
	departureTime,
	arrivalTime,
	duration,
	seatLabel,
	farePaidXOF,
	amenities,
	status,
}: TripSummaryCardProps) {
	const departureLabel = departureTime
		? `${formatDateWithWeekday(departureTime)} · ${formatTimeOnly(departureTime)}`
		: "";
	const arrivalLabel = arrivalTime
		? `${formatDateWithWeekday(arrivalTime)} · ${formatTimeOnly(arrivalTime)}`
		: "";

	return (
		<View
			style={{
				backgroundColor: Colors.light.background,
				borderRadius: 16,
				padding: Spacing.four,
				borderWidth: 1,
				borderColor: Colors.light.backgroundSelected,
				gap: Spacing.three,
			}}
		>
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					gap: Spacing.three,
				}}
			>
				{companyLogo ? (
					<View
						style={{
							width: 40,
							height: 40,
							borderRadius: 12,
							backgroundColor: Colors.light.backgroundElement,
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<Text
							style={{
								fontSize: 16,
								fontWeight: "800",
								color: Colors.light.primary,
							}}
						>
							{companyName.charAt(0)}
						</Text>
					</View>
				) : null}

				<View style={{ flex: 1 }}>
					<Text
						style={{
							fontSize: 15,
							fontWeight: "700",
							color: Colors.light.text,
						}}
					>
						{companyName}
					</Text>
					{status ? (
						<Text
							style={{
								fontSize: 12,
								color: Colors.light.textSecondary,
								marginTop: 2,
							}}
						>
							{status}
						</Text>
					) : null}
				</View>
			</View>

			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					gap: Spacing.two,
				}}
			>
				<View style={{ flex: 1 }}>
					<Text
						style={{
							fontSize: 18,
							fontWeight: "800",
							color: Colors.light.text,
						}}
					>
						{origin}
					</Text>
					<Text
						style={{
							fontSize: 13,
							color: Colors.light.textSecondary,
							marginTop: 2,
						}}
					>
						{departureLabel}
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
						size={20}
						color={Colors.light.primary}
					/>
					{duration ? (
						<Text
							style={{
								fontSize: 10,
								color: Colors.light.textSecondary,
								marginTop: 4,
							}}
						>
							{duration}
						</Text>
					) : null}
				</View>

				<View style={{ flex: 1, alignItems: "flex-end" }}>
					<Text
						style={{
							fontSize: 18,
							fontWeight: "800",
							color: Colors.light.text,
						}}
					>
						{destination}
					</Text>
					<Text
						style={{
							fontSize: 13,
							color: Colors.light.textSecondary,
							marginTop: 2,
						}}
					>
						{arrivalLabel}
					</Text>
				</View>
			</View>

			{seatLabel || farePaidXOF ? (
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						gap: Spacing.three,
						paddingTop: Spacing.two,
						borderTopWidth: 1,
						borderTopColor: Colors.light.backgroundSelected,
					}}
				>
					{seatLabel ? (
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								gap: Spacing.one,
							}}
						>
							<HugeiconsIcon
								icon={AirplaneSeatIcon}
								size={14}
								color={Colors.light.textSecondary}
							/>
							<Text
								style={{
									fontSize: 13,
									fontWeight: "600",
									color: Colors.light.text,
								}}
							>
								{seatLabel}
							</Text>
						</View>
					) : null}

					{farePaidXOF ? (
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								gap: Spacing.one,
							}}
						>
							<HugeiconsIcon
								icon={MoneyIcon}
								size={14}
								color={Colors.light.primary}
							/>
							<Text
								style={{
									fontSize: 13,
									fontWeight: "700",
									color: Colors.light.primary,
								}}
							>
								{farePaidXOF.toLocaleString()} XOF
							</Text>
						</View>
					) : null}
				</View>
			) : null}

			{amenities && amenities.length > 0 ? (
				<View
					style={{
						flexDirection: "row",
						flexWrap: "wrap",
						gap: Spacing.two,
					}}
				>
					{amenities.map((amenity) => (
						<View
							key={amenity}
							style={{
								paddingHorizontal: Spacing.two,
								paddingVertical: Spacing.one,
								borderRadius: 8,
								backgroundColor: Colors.light.backgroundElement,
								borderWidth: 1,
								borderColor: Colors.light.backgroundSelected,
							}}
						>
							<Text
								style={{
									fontSize: 11,
									fontWeight: "600",
									color: Colors.light.textSecondary,
								}}
							>
								{amenity}
							</Text>
						</View>
					))}
				</View>
			) : null}
		</View>
	);
}
