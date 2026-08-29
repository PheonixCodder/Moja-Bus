import {
	DarkTheme,
	DefaultTheme,
	type Theme,
} from "expo-router/react-navigation";
import { colors } from "@/constants/theme";

export const THEME = {
	dark: {
		background: colors.neutral.background,
		card: colors.neutral.surface,
		text: colors.neutral.textPrimary,
		border: colors.neutral.border,
		notification: colors.primary.rose,
		primary: colors.primary.rose,
	},
	light: {
		background: colors.neutral.background,
		card: colors.neutral.surface,
		text: colors.neutral.textPrimary,
		border: colors.neutral.border,
		notification: colors.primary.rose,
		primary: colors.primary.rose,
	},
};

export const NAV_THEME: Theme = {
	...DarkTheme,
	dark: true,
	colors: {
		...DarkTheme.colors,
		background: colors.neutral.background,
		card: colors.neutral.surface,
		text: colors.neutral.textPrimary,
		border: colors.neutral.border,
		primary: colors.primary.rose,
		notification: colors.primary.rose,
	},
};
