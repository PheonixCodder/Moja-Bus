import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Comment01Icon } from '@hugeicons/core-free-icons';
import { IconColors } from "@/constants/ui-colors";
import { Colors } from '@/constants/theme';

export function OperatorReviewsTab() {
  const { t } = useTranslation('operators');

  return (
    <View className="flex-1 items-center justify-center px-8 py-24">
      <View className="w-20 h-20 bg-muted rounded-3xl items-center justify-center mb-6">
        <HugeiconsIcon icon={Comment01Icon} size={36} color={IconColors.muted} />
      </View>
      <Text className="text-xl font-bold text-foreground text-center mb-3">
        {t('reviewsSoon')}
      </Text>
      <Text className="text-sm text-muted-foreground text-center leading-relaxed">
        {t('reviewsSoonDesc')}
      </Text>
    </View>
  );
}
