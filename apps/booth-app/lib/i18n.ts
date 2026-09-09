import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@/locales/en.json";
import fr from "@/locales/fr.json";

export const USER_LOCALE_STORAGE_KEY = "booth-app-user-locale";
export type SupportedLocale = "fr" | "en";

const deviceLanguage = getLocales()?.[0]?.languageCode ?? "fr";
const initialLanguage: SupportedLocale = deviceLanguage.startsWith("fr")
  ? "fr"
  : "en";

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: initialLanguage,
  fallbackLng: "fr",
  defaultNS: "translation",
  interpolation: {
    escapeValue: false,
  },
});

// Restore persisted language preference on startup
AsyncStorage.getItem(USER_LOCALE_STORAGE_KEY)
  .then((stored) => {
    if (stored === "fr" || stored === "en") {
      if (i18n.language !== stored) {
        void i18n.changeLanguage(stored);
      }
    }
  })
  .catch(() => {});

export async function switchLanguage(locale: SupportedLocale): Promise<void> {
  await i18n.changeLanguage(locale);
  try {
    await AsyncStorage.setItem(USER_LOCALE_STORAGE_KEY, locale);
  } catch {}
}

export function getCurrentLanguage(): SupportedLocale {
  return i18n.language.startsWith("fr") ? "fr" : "en";
}

export default i18n;
