import { useLocalSearchParams } from 'expo-router';
import Animated from 'react-native-reanimated';
import { useScreenTransition } from '@/hooks/use-screen-transition';
import { OperatorProfileView } from '@/features/operators/screens/operator-profile';

export default function OperatorProfileScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const animatedStyle = useScreenTransition();
  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <OperatorProfileView slug={slug ?? ''} />
    </Animated.View>
  );
}
