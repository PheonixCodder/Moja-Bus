import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Location01Icon, Call02Icon } from '@hugeicons/core-free-icons';
import { Colors, Palette } from '@/constants/theme';

interface TerminalItem {
  id: string;
  name: string;
  addressLine1?: string | null;
  city?: string | null;
  phone?: string | null;
  managerName?: string | null;
  cityRelation?: { name: string } | null;
}

interface OperatorTerminalsTabProps {
  terminals: TerminalItem[];
}

export function OperatorTerminalsTab({ terminals }: OperatorTerminalsTabProps) {
  const { t } = useTranslation('operators');

  if (terminals.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <Text className="text-muted-foreground text-sm text-center">{t('noTerminals')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
    >
      <Text className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">
        {t('terminalCount_other', { count: terminals.length })}
      </Text>
      {terminals.map((terminal) => {
        const cityName = terminal.cityRelation?.name ?? terminal.city;

        return (
          <View
            key={terminal.id}
            className="bg-card border border-border rounded-2xl p-4 gap-3 shadow-xs"
          >
            {/* Terminal icon + name */}
            <View className="flex-row items-start gap-3">
              <View className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl items-center justify-center shrink-0 mt-0.5">
                <HugeiconsIcon icon={Location01Icon} size={18} color={Palette.rose[500]} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-foreground mb-0.5">{terminal.name}</Text>
                {terminal.addressLine1 ? (
                  <Text className="text-xs text-muted-foreground">
                    {terminal.addressLine1}
                    {cityName ? `, ${cityName}` : ''}
                  </Text>
                ) : cityName ? (
                  <Text className="text-xs text-muted-foreground">{cityName}</Text>
                ) : null}
              </View>
            </View>

            {/* Phone */}
            {terminal.phone ? (
              <Pressable
                onPress={() => Linking.openURL(`tel:${terminal.phone}`)}
                className="will-change-pressable flex-row items-center gap-2 active:opacity-70"
              >
                <HugeiconsIcon icon={Call02Icon} size={14} color={Palette.rose[500]} />
                <Text className="text-xs font-semibold text-primary">{terminal.phone}</Text>
              </Pressable>
            ) : null}

            {/* Manager */}
            {terminal.managerName ? (
              <Text className="text-sm text-muted-foreground">
                {t('manager', { name: terminal.managerName })}
              </Text>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}
