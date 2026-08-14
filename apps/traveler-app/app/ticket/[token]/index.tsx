import { useLocalSearchParams } from "expo-router";
import { useScreenTransition } from "@/hooks/use-screen-transition";
import Animated from "react-native-reanimated";
import { View } from "react-native";
import { PublicTicketView } from "@/features/booking/screens/public-ticket";
import { useEffect } from "react";
import { useBookingPrefetch } from "@/features/booking/hooks/use-booking-prefetch";

export default function TicketScreen() {
	const { token } = useLocalSearchParams<{ token: string }>();
	const animatedStyle = useScreenTransition();
	const { prefetchTicketByToken } = useBookingPrefetch();
	const ticketToken = token ? decodeURIComponent(token) : "";

	useEffect(() => {
		if (ticketToken) prefetchTicketByToken(ticketToken);
	}, [ticketToken, prefetchTicketByToken]);

	return (
		<Animated.View style={[{ flex: 1 }, animatedStyle]}>
			<View className="flex-1 bg-background">
				<PublicTicketView ticketToken={ticketToken} />
			</View>
		</Animated.View>
	);
}
