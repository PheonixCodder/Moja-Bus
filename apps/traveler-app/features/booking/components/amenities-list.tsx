import { Colors, Spacing } from "@moja/theme/tokens";
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
						flexDirection: "row",
						alignItems: "center",
						gap: 4,
					}}
				>
					<Text style={{ fontSize: 14 }}>{AMENITY_ICONS[amenity]}</Text>
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
	);
}
