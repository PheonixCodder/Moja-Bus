import { View, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import { SubpageHeader } from '@/components/subpage-header';
import { Text } from '@/components/ui/text';
import { BottomTabInset } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGES = [
  { code: 'en', labelKey: 'settings:english', nativeLabel: 'English' },
  { code: 'fr', labelKey: 'settings:french', nativeLabel: 'Français' },
] as const;

type LocaleCode = typeof LANGUAGES[number]['code'];

async function persistLocale(locale: string) {
  try {
    await AsyncStorage.setItem('user-locale', locale);
  } catch {
    // Silently fail — persistence is best-effort
  }
}

export default function LanguageScreen() {
  const { t } = useTranslation('settings');
  const insets = useSafeAreaInsets();
  const [currentLocale, setCurrentLocale] = useState(i18n.language);

  async function handleSwitchLocale(locale: LocaleCode) {
    await i18n.changeLanguage(locale);
    setCurrentLocale(locale);
    await persistLocale(locale);
  }

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingBottom: BottomTabInset + insets.bottom + 24 }}
    >
      <SubpageHeader title={t('language')} />

      <View className="px-4 pt-2 gap-3">
        <Text className="text-sm font-semibold text-slate-400 tracking-[0.8px] uppercase mb-2 px-4">
          {t('currentLanguage')}
        </Text>

        {LANGUAGES.map((lang) => {
          const isActive = currentLocale === lang.code;
          return (
            <Pressable
              key={lang.code}
              onPress={() => handleSwitchLocale(lang.code)}
              className={`flex-row items-center py-4 px-4 rounded-xl border ${
                isActive
                  ? 'bg-pink-50 border-[#ee237c]'
                  : 'bg-white border-transparent'
              }`}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Text
                className={`flex-1 text-base ${
                  isActive ? 'font-bold text-[#ee237c]' : 'font-medium text-slate-900'
                }`}
              >
                {t(lang.labelKey as any)}
              </Text>

              {isActive ? (
                <Text className="text-sm font-semibold text-[#ee237c]">
                  {t('active')}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}