// Global type declarations for next-intl message type safety.
// Extends IntlMessages so t('key') is fully typed and compile-checked.
// If a key is missing in fr.json, next-intl falls back to en.json automatically.

import type en from "./messages/en.json";

type Messages = typeof en;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface IntlMessages extends Messages {}
}
