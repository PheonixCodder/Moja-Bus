import {
	AirplaneSeatIcon,
	ArrowRight01Icon,
	MoneyIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { formatDateWithWeekday, formatPriceXOF, formatTimeOnly } from "../lib/format-time";

type TripSummaryCardProps = {
	companyName: string;
	companyLogo?: string;
	origin: string;
	destination: string;
	departureTime: string | Date;
	arrivalTime: string | Date;
	duration?: string;
	seatLabel?: string;
	farePaidXOF?: number;
	amenities?: string[];
	status?: string;
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
	const { t } = useTranslation("booking");

	return (
		<View className="bg-card border-border rounded-2xl border p-4 shadow-xs space-y-3">
			<View className="flex-row items-center gap-3">
				<View className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 items-center justify-center">
					<Text className="text-primary text-xs font-black">
						{(companyName || 'MB').slice(0, 2).toUpperCase()}
					</Text>
				</View>

				<View className="flex-1">
					<Text className="text-foreground text-sm font-bold">
						{companyName || 'Moja Transport'}
					</Text>
					{status ? (
						<Text className="text-muted-foreground text-xs mt-0.5 capitalize">
							{status.toLowerCase()}
						</Text>
					) : null}
				</View>
			</View>

			<View className="flex-row items-center justify-between py-1">
				<View className="flex-1">
					<Text className="text-foreground font-black text-lg" numberOfLines={1}>
						{origin}
					</Text>
					<Text className="text-primary font-bold text-xs mt-0.5">
						{formatTimeOnly(departureTime)}
					</Text>
					<Text className="text-muted-foreground text-xs">
						{formatDateWithWeekday(departureTime)}
					</Text>
				</View>

				<View className="items-center px-2">
					<HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#ee237c" />
					{duration ? (
						<Text className="text-muted-foreground text-xs mt-1 font-medium">
							{duration}
						</Text>
					) : null}
				</View>

				<View className="flex-1 items-end">
					<Text className="text-foreground font-black text-lg text-right" numberOfLines={1}>
						{destination}
					</Text>
					<Text className="text-primary font-bold text-xs mt-0.5 text-right">
						{formatTimeOnly(arrivalTime)}
					</Text>
					<Text className="text-muted-foreground text-xs text-right">
						{formatDateWithWeekday(arrivalTime)}
					</Text>
				</View>
			</View>

			{(seatLabel || farePaidXOF) ? (
				<View className="flex-row items-center justify-between border-t border-border/40 pt-3">
					{seatLabel ? (
						<View className="flex-row items-center gap-1.5">
							<HugeiconsIcon icon={AirplaneSeatIcon} size={14} color="#64748b" />
							<Text className="text-foreground text-xs font-semibold">
								{t("seatSingle", { label: seatLabel })}
							</Text>
						</View>
					) : null}

					{farePaidXOF ? (
						<View className="flex-row items-center gap-1.5">
							<HugeiconsIcon icon={MoneyIcon} size={14} color="#ee237c" />
							<Text className="text-primary font-black text-xs">
								{formatPriceXOF(farePaidXOF)}
							</Text>
						</View>
					) : null}
				</View>
			) : null}
		</View>
	);
}
