import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enAuth from "../locales/en/auth.json";
import enTrips from "../locales/en/trips.json";
import enLive from "../locales/en/live.json";
import enScanner from "../locales/en/scanner.json";
import enManifest from "../locales/en/manifest.json";
import enEarnings from "../locales/en/earnings.json";
import enPassport from "../locales/en/passport.json";
import enDispatch from "../locales/en/dispatch.json";
import enOffers from "../locales/en/offers.json";
import enNotifications from "../locales/en/notifications.json";

import frAuth from "../locales/fr/auth.json";
import frTrips from "../locales/fr/trips.json";
import frLive from "../locales/fr/live.json";
import frScanner from "../locales/fr/scanner.json";
import frManifest from "../locales/fr/manifest.json";
import frEarnings from "../locales/fr/earnings.json";
import frPassport from "../locales/fr/passport.json";
import frDispatch from "../locales/fr/dispatch.json";
import frOffers from "../locales/fr/offers.json";
import frNotifications from "../locales/fr/notifications.json";

const deviceLanguage = getLocales()?.[0]?.languageCode ?? "fr";

i18n.use(initReactI18next).init({
	resources: {
		en: {
			auth: enAuth,
			trips: enTrips,
			live: enLive,
			scanner: enScanner,
			manifest: enManifest,
			earnings: enEarnings,
			passport: enPassport,
			dispatch: enDispatch,
			offers: enOffers,
			notifications: enNotifications,
		},
		fr: {
			auth: frAuth,
			trips: frTrips,
			live: frLive,
			scanner: frScanner,
			manifest: frManifest,
			earnings: frEarnings,
			passport: frPassport,
			dispatch: frDispatch,
			offers: frOffers,
			notifications: frNotifications,
		},
	},
	// French-first: drivers in Côte d'Ivoire are primarily Francophone.
	// Fallback to detected device language, then English.
	lng: deviceLanguage.startsWith("fr") ? "fr" : deviceLanguage,
	fallbackLng: "fr",
	ns: ["auth", "trips", "live", "scanner", "manifest", "earnings", "passport", "dispatch", "offers", "notifications"],
	defaultNS: "auth",
	interpolation: {
		escapeValue: false,
	},
});

export default i18n;
