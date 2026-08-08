import { PageHeader } from "@/components/page-header";
import { TicketsView } from "@/features/booking/views/tickets-view";
import { useScreenTransition } from "@/hooks/use-screen-transition";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated from "react-native-reanimated";

export default function TicketsScreen() {
	const { t } = useTranslation("booking");
	const animatedStyle = useScreenTransition();
	return (
		<Animated.View style={[{ flex: 1 }, animatedStyle]}>
			<View className="flex-1 bg-background">
				<PageHeader title={t("tickets")} description={t("viewActiveTickets")} />
				<TicketsView />
			</View>
		</Animated.View>
	);
}
