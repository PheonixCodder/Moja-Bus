import {
	Calendar01Icon,
	ClockIcon,
	Ticket01Icon,
	UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Colors, Spacing } from "@moja/theme/tokens";
import { View } from "react-native";
import { Text } from "@/components/ui/text";

type BookingKpiStripProps = {
	upcomingCount: number;
	pendingCount: number;
	ticketsCount: number;
	contactsCount: number;
};

export function BookingKpiStrip({
	upcomingCount,
	pendingCount,
	ticketsCount,
	contactsCount,
}: BookingKpiStripProps) {
	const items = [
		{
			icon: Calendar01Icon,
			label: "Upcoming",
			value: upcomingCount,
			color: Colors.light.primary,
		},
		{
			icon: ClockIcon,
			label: "Pending",
			value: pendingCount,
			color: "#f59e0b",
		},
		{
			icon: Ticket01Icon,
			label: "Tickets",
			value: ticketsCount,
			color: "#10b981",
		},
		{
			icon: UserGroupIcon,
			label: "Contacts",
			value: contactsCount,
			color: "#6366f1",
		},
	];

	return (
		<View
			style={{
				flexDirection: "row",
				gap: Spacing.two,
				paddingHorizontal: Spacing.four,
				paddingVertical: Spacing.three,
			}}
		>
			{items.map((item) => (
				<View
					key={item.label}
					style={{
						flex: 1,
						backgroundColor: Colors.light.background,
						borderRadius: 12,
						padding: Spacing.three,
						alignItems: "center",
						borderWidth: 1,
						borderColor: Colors.light.backgroundSelected,
					}}
				>
					<HugeiconsIcon icon={item.icon} size={18} color={item.color} />
					<Text
						style={{
							fontSize: 18,
							fontWeight: "800",
							color: Colors.light.text,
							marginTop: Spacing.one,
						}}
					>
						{item.value}
					</Text>
					<Text
						style={{
							fontSize: 10,
							fontWeight: "600",
							color: Colors.light.textSecondary,
							letterSpacing: 0.5,
							textTransform: "uppercase",
							marginTop: 2,
						}}
					>
						{item.label}
					</Text>
				</View>
			))}
		</View>
	);
}
