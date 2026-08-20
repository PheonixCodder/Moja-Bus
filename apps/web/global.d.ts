// Global type declarations for next-intl message type safety.
// Extends IntlMessages so t('key') is fully typed and compile-checked.
// If a key is missing in fr.json, next-intl falls back to en.json automatically.

import type globalEn from "./messages/en.json";
import type adminEn from "./features/admin/messages/en.json";
import type authEn from "./features/auth/messages/en.json";
import type blogEn from "./features/blog/messages/en.json";
import type bookingEn from "./features/booking/messages/en.json";
import type captureEn from "./features/capture/messages/en.json";
import type contactEn from "./features/contact/messages/en.json";
import type discountsEn from "./features/discounts/messages/en.json";
import type homeEn from "./features/home/messages/en.json";
import type invitationEn from "./features/invitation/messages/en.json";
import type notificationsEn from "./features/notifications/messages/en.json";
import type operatorEn from "./features/operator/messages/en.json";
import type passengerEn from "./features/passenger/messages/en.json";
import type searchEn from "./features/search/messages/en.json";

type Messages = typeof globalEn &
  typeof adminEn &
  typeof authEn &
  typeof blogEn &
  typeof bookingEn &
  typeof captureEn &
  typeof contactEn &
  typeof discountsEn &
  typeof homeEn &
  typeof invitationEn &
  typeof notificationsEn &
  typeof operatorEn &
  typeof passengerEn &
  typeof searchEn;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface IntlMessages extends Messages {}
}
