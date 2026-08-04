import Animated from "react-native-reanimated";
import { useScreenTransition } from "@/hooks/use-screen-transition";
import { PageHeader } from "@/components/page-header";
import { TicketsView } from "@/features/booking/views/tickets-view";

export default function TicketsScreen() {
  const animatedStyle = useScreenTransition();
  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <PageHeader title="Tickets" description="View your active tickets" />
      <TicketsView />
    </Animated.View>
  );
}
