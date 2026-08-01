import { View, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import { SubpageHeader } from '@/components/subpage-header';
import { Text } from '@/components/ui/text';
import { BottomTabInset } from '@/constants/theme';
import { Colors, Spacing } from '@moja/theme/tokens';
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
      style={{ flex: 1, backgroundColor: Colors.light.background }}
      contentContainerStyle={{ paddingBottom: BottomTabInset + insets.bottom + 24 }}
    >
      <SubpageHeader title={t('language')} />

      <View style={{ paddingHorizontal: Spacing.four, paddingTop: Spacing.two, gap: Spacing.three }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: '600',
            color: Colors.light.textSecondary,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            marginBottom: Spacing.two,
            paddingHorizontal: Spacing.four,
          }}
        >
          {t('currentLanguage')}
        </Text>

        {LANGUAGES.map((lang) => {
          const isActive = currentLocale === lang.code;
          return (
            <Pressable
              key={lang.code}
              onPress={() => handleSwitchLocale(lang.code)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: Spacing.four,
                paddingHorizontal: Spacing.four,
                opacity: pressed ? 0.6 : 1,
                backgroundColor: isActive ? 'rgba(238, 35, 124, 0.06)' : Colors.light.background,
                borderRadius: 12,
                borderWidth: isActive ? 1 : 0,
                borderColor: isActive ? Colors.light.primary : 'transparent',
              })}
            >
              <Text
                style={{
                  flex: 1,
                  fontSize: 15,
                  fontWeight: isActive ? '700' : '500',
                  color: isActive ? Colors.light.primary : Colors.light.text,
                }}
              >
                {t(lang.labelKey as any)}
              </Text>

              {isActive ? (
                <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.light.primary }}>
                  Active
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}