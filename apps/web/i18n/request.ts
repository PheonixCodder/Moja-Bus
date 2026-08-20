import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // Validate that the incoming `locale` parameter is valid
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as "en" | "fr")) {
    locale = routing.defaultLocale;
  }

  // Load global shared messages and all feature-level messages in parallel.
  // Object.assign merges them into a single flat namespace map — identical to
  // what was previously in the single monolith file. No useTranslations() call
  // sites need to change.
  const [
    global_,
    admin,
    auth,
    blog,
    booking,
    capture,
    contact,
    discounts,
    home,
    invitation,
    notifications,
    operator,
    passenger,
    search,
  ] = await Promise.all([
    import(`../messages/${locale}.json`),
    import(`../features/admin/messages/${locale}.json`),
    import(`../features/auth/messages/${locale}.json`),
    import(`../features/blog/messages/${locale}.json`),
    import(`../features/booking/messages/${locale}.json`),
    import(`../features/capture/messages/${locale}.json`),
    import(`../features/contact/messages/${locale}.json`),
    import(`../features/discounts/messages/${locale}.json`),
    import(`../features/home/messages/${locale}.json`),
    import(`../features/invitation/messages/${locale}.json`),
    import(`../features/notifications/messages/${locale}.json`),
    import(`../features/operator/messages/${locale}.json`),
    import(`../features/passenger/messages/${locale}.json`),
    import(`../features/search/messages/${locale}.json`),
  ]);

  return {
    locale,
    messages: Object.assign(
      {},
      global_.default,
      admin.default,
      auth.default,
      blog.default,
      booking.default,
      capture.default,
      contact.default,
      discounts.default,
      home.default,
      invitation.default,
      notifications.default,
      operator.default,
      passenger.default,
      search.default,
    ),
  };
});
