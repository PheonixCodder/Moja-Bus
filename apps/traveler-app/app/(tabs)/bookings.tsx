import { PageHeader } from "@/components/page-header";
import { BookingsView } from "@/features/booking/screens/bookings";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useScreenTransition } from "@/hooks/use-screen-transition";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated from "react-native-reanimated";

export default function BookingsScreen() {
	const { t } = useTranslation("booking");
	const animatedStyle = useScreenTransition();
	const isAuth = useRequireAuth("/(tabs)/bookings");

	if (!isAuth) return null;

	return (
		<Animated.View style={[{ flex: 1 }, animatedStyle]}>
			<View className="flex-1 bg-background">
				<PageHeader title={t("bookings")} description={t("manageYourTrips")} />
				<BookingsView />
			</View>
		</Animated.View>
	);
}