import 'i18next';
import enCommon from '../locales/en/common.json';
import enSettings from '../locales/en/settings.json';
import enAuth from '../locales/en/auth.json';
import enWallet from '../locales/en/wallet.json';
import enNotifications from '../locales/en/notifications.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof enCommon;
      settings: typeof enSettings;
      auth: typeof enAuth;
      wallet: typeof enWallet;
      notifications: typeof enNotifications;
    };
  }
}