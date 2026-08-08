import {
	ArrowRight01Icon,
	QrCodeIcon,
	Shield01Icon,
	Ticket01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Colors } from "@moja/theme/tokens";
import * as Haptics from "expo-haptics";
import { Pressable, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";

type DigitalTicketCardProps = {
	bookingReference: string;
	companyName: string;
	origin: string;
	destination: string;
	departureTime: string;
	arrivalTime: string;
	seatLabel: string;
	passengerName: string;
	status?: string;
	compact?: boolean;
	onPress?: () => void;
	onPressIn?: () => void;
};

function formatTimeOnly(dateStr: string): string {
	if (!dateStr) return "--:--";
	try {
		const date = new Date(dateStr);
		if (Number.isNaN(date.getTime())) return dateStr;
		return date.toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});
	} catch {
		return dateStr;
	}
}

export function DigitalTicketCard({
	bookingReference,
	companyName,
	origin,
	destination,
	departureTime,
	arrivalTime,
	seatLabel,
	passengerName,
	status = "CONFIRMED",
	compact = false,
	onPress,
	onPressIn,
}: DigitalTicketCardProps) {
	const scale = useSharedValue(1);

	const handlePress = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		onPress?.();
	};

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	const handlePressIn = () => {
		scale.value = withSpring(0.97);
		onPressIn?.();
	};

	const handlePressOut = () => {
		scale.value = withSpring(1);
	};

	return (
		<Animated.View style={animatedStyle} className="mb-4">
			<Pressable
				onPress={handlePress}
				onPressIn={handlePressIn}
				onPressOut={handlePressOut}
				className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm relative"
			>
				{/* Top Section: Header */}
				<View className="p-4 bg-primary/5 border-b border-border/40 flex-row items-center justify-between">
					<View className="flex-row items-center gap-2 flex-1 min-w-0 mr-2">
						<View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center border border-primary/20 shrink-0">
							<HugeiconsIcon icon={Ticket01Icon} size={16} color="#ee237c" />
						</View>
						<View className="flex-1 min-w-0">
							<Text
								className="text-xs font-black text-foreground uppercase tracking-wide truncate"
								numberOfLines={1}
							>
								{companyName || "Moja Express"}
							</Text>
							<Text className="text-[10px] font-mono text-muted-foreground">
								REF: {bookingReference}
							</Text>
						</View>
					</View>

					<View className="flex-row items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
						<HugeiconsIcon icon={Shield01Icon} size={10} color="#10b981" />
						<Text className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-widest">
							VALID
						</Text>
					</View>
				</View>

				{/* Route Body Section */}
				<View className="p-4 flex-row items-center justify-between">
					<View className="flex-1">
						<Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
							FROM
						</Text>
						<Text
							className="text-base font-extrabold text-foreground"
							numberOfLines={1}
						>
							{origin}
						</Text>
						<Text className="text-xs font-semibold text-primary mt-0.5">
							{formatTimeOnly(departureTime)}
						</Text>
					</View>

					<View className="px-3 items-center">
						<HugeiconsIcon
							icon={ArrowRight01Icon}
							size={18}
							color={Colors.light.primary}
						/>
					</View>

					<View className="flex-1 items-end">
						<Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">
							TO
						</Text>
						<Text
							className="text-base font-extrabold text-foreground text-right"
							numberOfLines={1}
						>
							{destination}
						</Text>
						<Text className="text-xs font-semibold text-primary mt-0.5 text-right">
							{formatTimeOnly(arrivalTime)}
						</Text>
					</View>
				</View>

				{/* Dashed Tear-Line with Side Notch Circles */}
				<View className="relative my-1 justify-center">
					{/* Left Notch */}
					<View className="absolute -left-3.5 w-6 h-6 rounded-full bg-background border border-border z-20" />
					{/* Dashed Separator */}
					<View className="w-full border-t border-dashed border-border/80" />
					{/* Right Notch */}
					<View className="absolute -right-3.5 w-6 h-6 rounded-full bg-background border border-border z-20" />
				</View>

				{/* Footer: Passenger + Seat + QR Code Action */}
				<View className="p-4 flex-row items-center justify-between bg-card">
					<View className="flex-1 mr-2">
						<Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
							PASSENGER
						</Text>
						<Text
							className="text-xs font-bold text-foreground"
							numberOfLines={1}
						>
							{passengerName || "Valued Traveler"}
						</Text>
						<Text className="text-[11px] font-extrabold text-primary mt-0.5">
							Seat {seatLabel || "Gen"}
						</Text>
					</View>

					{/* QR Code Icon Button */}
					<View className="w-11 h-11 rounded-full bg-primary/10 border border-primary/20 items-center justify-center shadow-xs">
						<HugeiconsIcon icon={QrCodeIcon} size={22} color="#ee237c" />
					</View>
				</View>
			</Pressable>
		</Animated.View>
	);
}
