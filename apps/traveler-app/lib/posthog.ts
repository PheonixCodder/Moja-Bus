import PostHog from "posthog-react-native";

const API_KEY = process.env["EXPO_PUBLIC_POSTHOG_KEY"];
const HOST = process.env["EXPO_PUBLIC_POSTHOG_HOST"];

export const posthog =
	API_KEY && HOST ? new PostHog(API_KEY, { host: HOST }) : null;
