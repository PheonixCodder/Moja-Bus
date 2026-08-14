import { View } from "react-native";
import { Text } from "@/components/ui/text";

type Amenity = "AC" | "WIFI" | "TOILET" | "USB" | "LUGGAGE" | "VIP";

const AMENITY_ICONS: Record<Amenity, string> = {
	AC: "❄️",
	WIFI: "📶",
	TOILET: "🚻",
	USB: "🔌",
	LUGGAGE: "🧳",
	VIP: "⭐",
};

type AmenitiesListProps = {
	amenities: Amenity[];
};

export function AmenitiesList({ amenities }: AmenitiesListProps) {
	if (amenities.length === 0) return null;

	return (
		<View className="flex-row flex-wrap gap-2">
			{amenities.map((amenity) => (
				<View
					key={amenity}
					className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 flex-row items-center gap-1"
				>
					<Text className="text-xs">{AMENITY_ICONS[amenity]}</Text>
					<Text className="text-sm font-semibold text-slate-500">
						{amenity}
					</Text>
				</View>
			))}
		</View>
	);
}
