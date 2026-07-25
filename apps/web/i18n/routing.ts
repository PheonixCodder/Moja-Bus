import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "fr"],
  defaultLocale: "en",
  // English is served at /  (no prefix), French at /fr/...
  localePrefix: "as-needed",
});
