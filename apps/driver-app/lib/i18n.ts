import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
import enLanguage from "../locales/en/language.json";

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
import frLanguage from "../locales/fr/language.json";

export const USER_LOCALE_STORAGE_KEY = "user-locale";
export type SupportedLocale = "fr" | "en";

const deviceLanguage = getLocales()?.[0]?.languageCode ?? "fr";
const initialLanguage = deviceLanguage.startsWith("fr") ? "fr" : "en";

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
			language: enLanguage,
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
			language: frLanguage,
		},
	},
	lng: initialLanguage,
	fallbackLng: "fr",
	ns: [
		"auth",
		"trips",
		"live",
		"scanner",
		"manifest",
		"earnings",
		"passport",
		"dispatch",
		"offers",
		"notifications",
		"language",
	],
	defaultNS: "auth",
	interpolation: {
		escapeValue: false,
	},
});

// Asynchronously load stored user locale preference
AsyncStorage.getItem(USER_LOCALE_STORAGE_KEY)
	.then((storedLocale) => {
		if (storedLocale === "fr" || storedLocale === "en") {
			if (i18n.language !== storedLocale) {
				void i18n.changeLanguage(storedLocale);
			}
		}
	})
	.catch(() => {});

export async function switchLanguage(locale: SupportedLocale) {
	await i18n.changeLanguage(locale);
	try {
		await AsyncStorage.setItem(USER_LOCALE_STORAGE_KEY, locale);
	} catch {}
}

export function getCurrentLanguage(): SupportedLocale {
	return i18n.language.startsWith("fr") ? "fr" : "en";
}

export default i18n;
