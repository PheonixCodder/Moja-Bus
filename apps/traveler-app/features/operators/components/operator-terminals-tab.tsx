import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Location01Icon, Call02Icon } from '@hugeicons/core-free-icons';

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
        <Text className="text-slate-400 text-sm text-center">{t('noTerminals')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
    >
      <Text className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
        {t('terminalCount_other', { count: terminals.length })}
      </Text>
      {terminals.map((terminal) => {
        const cityName = terminal.cityRelation?.name ?? terminal.city;

        return (
          <View
            key={terminal.id}
            className="bg-white border border-slate-200 rounded-2xl p-4 gap-3"
            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}
          >
            {/* Terminal icon + name */}
            <View className="flex-row items-start gap-3">
              <View className="w-10 h-10 bg-pink-50 border border-pink-100 rounded-xl items-center justify-center shrink-0 mt-0.5">
                <HugeiconsIcon icon={Location01Icon} size={18} color="#ee237c" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-slate-900 mb-0.5">{terminal.name}</Text>
                {terminal.addressLine1 ? (
                  <Text className="text-xs text-slate-500">
                    {terminal.addressLine1}
                    {cityName ? `, ${cityName}` : ''}
                  </Text>
                ) : cityName ? (
                  <Text className="text-xs text-slate-500">{cityName}</Text>
                ) : null}
              </View>
            </View>

            {/* Phone */}
            {terminal.phone ? (
              <Pressable
                onPress={() => Linking.openURL(`tel:${terminal.phone}`)}
                className="will-change-pressable flex-row items-center gap-2 active:opacity-70"
              >
                <HugeiconsIcon icon={Call02Icon} size={14} color="#ee237c" />
                <Text className="text-xs font-semibold text-[#ee237c]">{terminal.phone}</Text>
              </Pressable>
            ) : null}

            {/* Manager */}
            {terminal.managerName ? (
              <Text className="text-sm text-slate-400">
                {t('manager', { name: terminal.managerName })}
              </Text>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}
