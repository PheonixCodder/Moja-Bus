import Animated from 'react-native-reanimated';
import { useScreenTransition } from '@/hooks/use-screen-transition';
import { OperatorsListView } from '@/features/operators/screens/operators-list';

export default function OperatorsScreen() {
  const animatedStyle = useScreenTransition();
  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <OperatorsListView />
    </Animated.View>
  );
}
