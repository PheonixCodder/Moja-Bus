import { Platform } from "react-native";

export {
  Colors,
  Fonts,
  Palette,
  primaryRGB,
  Spacing,
  type ThemeColor,
} from "@moja/theme/tokens";

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

// ── Compact Type Scale ──────────────────────────────────────────
export const FontSize = {
	h1: 32,
	h2: 24,
	h3: 20,
	h4: 16,
	bodyLg: 16,
	bodyMd: 14,
	bodySm: 13,
	caption: 11,
} as const;

export const LineHeight = {
	h1: 38,
	h2: 30,
	h3: 26,
	h4: 22,
	bodyLg: 22,
	bodyMd: 20,
	bodySm: 18,
	caption: 15,
} as const;

export const FontWeight = {
	regular: "400",
	medium: "500",
	semiBold: "600",
	bold: "700",
} as const;

export const fontFamily = {
	regular: "Outfit",
	medium: "Outfit-Medium",
	semiBold: "Outfit-SemiBold",
	bold: "Outfit-Bold",
	headingRegular: "Raleway",
	headingMedium: "Raleway-Medium",
	headingSemiBold: "Raleway-SemiBold",
	headingBold: "Raleway-Bold",
} as const;

export const textStyles = {
	h1: {
		fontFamily: fontFamily.headingBold,
		fontSize: FontSize.h1,
		fontWeight: FontWeight.bold,
		lineHeight: LineHeight.h1,
	},
	h2: {
		fontFamily: fontFamily.headingBold,
		fontSize: FontSize.h2,
		fontWeight: FontWeight.bold,
		lineHeight: LineHeight.h2,
	},
	h3: {
		fontFamily: fontFamily.headingSemiBold,
		fontSize: FontSize.h3,
		fontWeight: FontWeight.semiBold,
		lineHeight: LineHeight.h3,
	},
	h4: {
		fontFamily: fontFamily.headingMedium,
		fontSize: FontSize.h4,
		fontWeight: FontWeight.medium,
		lineHeight: LineHeight.h4,
	},
	bodyLg: {
		fontFamily: fontFamily.regular,
		fontSize: FontSize.bodyLg,
		fontWeight: FontWeight.regular,
		lineHeight: LineHeight.bodyLg,
	},
	bodyMd: {
		fontFamily: fontFamily.regular,
		fontSize: FontSize.bodyMd,
		fontWeight: FontWeight.regular,
		lineHeight: LineHeight.bodyMd,
	},
	bodySm: {
		fontFamily: fontFamily.regular,
		fontSize: FontSize.bodySm,
		fontWeight: FontWeight.regular,
		lineHeight: LineHeight.bodySm,
	},
	caption: {
		fontFamily: fontFamily.regular,
		fontSize: FontSize.caption,
		fontWeight: FontWeight.regular,
		lineHeight: LineHeight.caption,
	},
} as const;