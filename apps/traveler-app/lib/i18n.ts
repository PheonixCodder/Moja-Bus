import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enBooking from '../locales/en/booking.json';
import enCommon from '../locales/en/common.json';
import enSettings from '../locales/en/settings.json';
import enAuth from '../locales/en/auth.json';
import enWallet from '../locales/en/wallet.json';
import enNotifications from '../locales/en/notifications.json';
import enSearch from '../locales/en/search.json';
import enOperators from '../locales/en/operators.json';
import enHome from '../locales/en/home.json';

import frBooking from '../locales/fr/booking.json';
import frCommon from '../locales/fr/common.json';
import frSettings from '../locales/fr/settings.json';
import frAuth from '../locales/fr/auth.json';
import frWallet from '../locales/fr/wallet.json';
import frNotifications from '../locales/fr/notifications.json';
import frSearch from '../locales/fr/search.json';
import frOperators from '../locales/fr/operators.json';
import frHome from '../locales/fr/home.json';

const deviceLanguage = getLocales()?.[0]?.languageCode ?? 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: {
      common: enCommon,
      settings: enSettings,
      auth: enAuth,
      wallet: enWallet,
      notifications: enNotifications,
      booking: enBooking,
      search: enSearch,
      operators: enOperators,
      home: enHome,
    },
    fr: {
      common: frCommon,
      settings: frSettings,
      auth: frAuth,
      wallet: frWallet,
      notifications: frNotifications,
      booking: frBooking,
      search: frSearch,
      operators: frOperators,
      home: frHome,
    },
  },
  lng: deviceLanguage,
  fallbackLng: 'en',
  ns: ['common', 'settings', 'auth', 'wallet', 'notifications', 'booking', 'search', 'operators', 'home'],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;