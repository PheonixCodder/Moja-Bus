import {
	Calendar01Icon,
	Clock01Icon,
	Ticket01Icon,
	UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Palette } from "@/constants/theme";

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
	const { t } = useTranslation("booking");

	const items = [
		{
			icon: Calendar01Icon,
			labelKey: "upcomingLabel",
			value: upcomingCount,
			color: Palette.rose[500],
			bg: "bg-primary/10",
		},
		{
			icon: Clock01Icon,
			labelKey: "pendingLabel",
			value: pendingCount,
			color: Palette.amber[500],
			bg: "bg-warning/10",
		},
		{
			icon: Ticket01Icon,
			labelKey: "ticketsLabel",
			value: ticketsCount,
			color: Palette.emerald[500],
			bg: "bg-success/10",
		},
		{
			icon: UserGroupIcon,
			labelKey: "savedLabel",
			value: contactsCount,
			color: Palette.blue[500],
			bg: "bg-info/10",
		},
	];

	return (
		<View className="flex-row gap-2 px-4 py-3">
			{items.map((item) => (
				<View
					key={item.labelKey}
					className="flex-1 bg-card border-border rounded-2xl border p-3 items-center shadow-xs"
				>
					<View className={`w-8 h-8 rounded-full ${item.bg} items-center justify-center mb-1`}>
						<HugeiconsIcon icon={item.icon} size={16} color={item.color} />
					</View>
					<Text className="text-foreground font-black text-base">
						{item.value}
					</Text>
					<Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider mt-0.5">
						{t(item.labelKey as any)}
					</Text>
				</View>
			))}
		</View>
	);
}
