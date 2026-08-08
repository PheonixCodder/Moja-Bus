import {
	Bus01Icon,
	Calendar01Icon,
	Clock01Icon,
	Location01Icon,
	Ticket01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Colors } from "@moja/theme/tokens";
import * as Haptics from "expo-haptics";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { useHoldCountdown } from "../hooks/use-hold-countdown";

export type BookingStatus =
	| "CONFIRMED"
	| "PENDING_PAYMENT"
	| "COMPLETED"
	| "CANCELLED"
	| "EXPIRED";

export type BookingCardData = {
	bookingReference: string;
	status: BookingStatus;
	companyName: string;
	origin: string;
	destination: string;
	departureTime: string;
	arrivalTime: string;
	seatLabel?: string;
	farePaidXOF?: number;
	holdExpiresAt?: string;
};

type BookingCardProps = {
	booking: BookingCardData;
	onPress: () => void;
	onPressIn?: () => void;
};

const STATUS_CONFIG: Record<
	BookingStatus,
	{ label: string; bg: string; text: string; border: string }
> = {
	CONFIRMED: {
		label: "Confirmed",
		bg: "bg-emerald-500/10",
		text: "text-emerald-600",
		border: "border-emerald-500/20",
	},
	PENDING_PAYMENT: {
		label: "Awaiting Payment",
		bg: "bg-amber-500/10",
		text: "text-amber-600",
		border: "border-amber-500/20",
	},
	COMPLETED: {
		label: "Completed",
		bg: "bg-blue-500/10",
		text: "text-blue-600",
		border: "border-blue-500/20",
	},
	CANCELLED: {
		label: "Cancelled",
		bg: "bg-rose-500/10",
		text: "text-rose-600",
		border: "border-rose-500/20",
	},
	EXPIRED: {
		label: "Expired",
		bg: "bg-neutral-500/10",
		text: "text-neutral-500",
		border: "border-neutral-500/20",
	},
};

function formatDate(dateStr: string): string {
	if (!dateStr) return "";
	try {
		const date = new Date(dateStr);
		if (Number.isNaN(date.getTime())) return dateStr;
		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch {
		return dateStr;
	}
}

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

export function BookingCard({ booking, onPress, onPressIn }: BookingCardProps) {
	const statusInfo =
		STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.EXPIRED;
	const isPending = booking.status === "PENDING_PAYMENT";
	const countdown = useHoldCountdown(
		isPending && booking.holdExpiresAt ? booking.holdExpiresAt : "",
	);

	const handlePress = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onPress();
	};

	const initials = (booking.companyName || "MB")
		.slice(0, 2)
		.toUpperCase();

	return (
		<Pressable
			onPress={handlePress}
			onPressIn={onPressIn}
			style={({ pressed }) => ({
				transform: [{ scale: pressed ? 0.98 : 1 }],
				opacity: pressed ? 0.9 : 1,
			})}
			className="bg-card rounded-2xl p-4 border border-border mb-3 shadow-sm overflow-hidden"
		>
			{/* Top Header: Company Avatar + Name + BookingRef + Status Badge */}
			<View className="flex-row items-center justify-between mb-3.5">
				<View className="flex-row items-center gap-2.5 flex-1 min-w-0 mr-2">
					<View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center border border-primary/20 shrink-0">
						<Text className="text-xs font-black text-primary">
							{initials}
						</Text>
					</View>
					<View className="flex-1 min-w-0">
						<Text
							className="text-sm font-bold text-foreground truncate"
							numberOfLines={1}
						>
							{booking.companyName || "Moja Bus"}
						</Text>
						<Text className="text-[11px] font-mono text-muted-foreground">
							{booking.bookingReference}
						</Text>
					</View>
				</View>

				<View
					className={`px-2.5 py-1 rounded-full border ${statusInfo.bg} ${statusInfo.border}`}
				>
					<Text className={`text-[10px] font-extrabold uppercase tracking-wider ${statusInfo.text}`}>
						{statusInfo.label}
					</Text>
				</View>
			</View>

			{/* Hold Countdown Warning Banner if Pending */}
			{isPending && countdown && countdown !== "Expired" ? (
				<View className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-1.5 mb-3 flex-row items-center gap-1.5">
					<HugeiconsIcon icon={Clock01Icon} size={14} color="#d97706" />
					<Text className="text-xs font-semibold text-amber-700">
						Hold expires in {countdown}
					</Text>
				</View>
			) : null}

			{/* Route Visual Track */}
			<View className="flex-row items-center justify-between my-2 px-1">
				{/* Origin */}
				<View className="flex-1">
					<Text className="text-base font-extrabold text-foreground">
						{formatTimeOnly(booking.departureTime)}
					</Text>
					<Text
						className="text-xs font-semibold text-muted-foreground mt-0.5"
						numberOfLines={1}
					>
						{booking.origin}
					</Text>
					<Text className="text-[10px] text-muted-foreground/70">
						{formatDate(booking.departureTime)}
					</Text>
				</View>

				{/* Middle Track Line + Bus Icon */}
				<View className="flex-1 items-center px-2">
					<View className="w-full h-[2px] bg-border relative items-center justify-center">
						<View className="absolute left-0 w-2 h-2 rounded-full bg-muted-foreground/40" />
						<View className="bg-card px-1.5 z-10">
							<HugeiconsIcon icon={Bus01Icon} size={16} color={Colors.light.primary} />
						</View>
						<View className="absolute right-0 w-2 h-2 rounded-full bg-primary" />
					</View>
				</View>

				{/* Destination */}
				<View className="flex-1 items-end">
					<Text className="text-base font-extrabold text-foreground">
						{formatTimeOnly(booking.arrivalTime)}
					</Text>
					<Text
						className="text-xs font-semibold text-muted-foreground mt-0.5 text-right"
						numberOfLines={1}
					>
						{booking.destination}
					</Text>
					<Text className="text-[10px] text-muted-foreground/70 text-right">
						{formatDate(booking.arrivalTime)}
					</Text>
				</View>
			</View>

			{/* Footer: Seat + Fare */}
			<View className="flex-row items-center justify-between pt-3 mt-2 border-t border-border/60">
				<View className="flex-row items-center gap-1.5">
					<HugeiconsIcon
						icon={Ticket01Icon}
						size={14}
						color={Colors.light.textSecondary}
					/>
					<Text className="text-xs font-medium text-muted-foreground">
						{booking.seatLabel ? `Seat ${booking.seatLabel}` : "Reserved"}
					</Text>
				</View>

				{booking.farePaidXOF ? (
					<Text className="text-sm font-black text-primary">
						{booking.farePaidXOF.toLocaleString()} XOF
					</Text>
				) : null}
			</View>
		</Pressable>
	);
}
