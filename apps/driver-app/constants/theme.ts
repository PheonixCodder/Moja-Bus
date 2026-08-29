// Design tokens — mirrors the Moja Driver design system in global.css.
// Inspired by Lingua design tokens with Moja theme specifications.

export const colors = {
	primary: {
		rose: "#ee237c",
		deepRose: "#be123c",
		emerald: "#10b981",
		blue: "#3b82f6",
	},
	semantic: {
		success: "#10b981",
		warning: "#f59e0b",
		streak: "#f97316",
		error: "#ef4444",
		info: "#3b82f6",
	},
	neutral: {
		background: "#09090b",
		surface: "#18181b",
		elevated: "#27272a",
		border: "#27272a",
		borderStrong: "#3f3f46",
		textPrimary: "#fafafa",
		textSecondary: "#a1a1aa",
		textMuted: "#71717a",
	},
} as const;

export const fontFamily = {
	regular: "Montserrat",
	medium: "Montserrat-Medium",
	semiBold: "Montserrat-SemiBold",
	bold: "Montserrat-Bold",
} as const;

export const fontSize = {
	h1: 28,
	h2: 22,
	h3: 18,
	h4: 15,
	bodyLg: 16,
	bodyMd: 14,
	bodySm: 12,
	caption: 11,
} as const;

export const lineHeight = {
	h1: 34,
	h2: 28,
	h3: 24,
	h4: 20,
	bodyLg: 24,
	bodyMd: 20,
	bodySm: 18,
	caption: 15,
} as const;

export const fontWeight = {
	regular: "400",
	medium: "500",
	semiBold: "600",
	bold: "700",
} as const;

export const textStyles = {
	h1: {
		fontFamily: fontFamily.bold,
		fontSize: fontSize.h1,
		fontWeight: fontWeight.bold,
		lineHeight: lineHeight.h1,
		color: colors.neutral.textPrimary,
	},
	h2: {
		fontFamily: fontFamily.bold,
		fontSize: fontSize.h2,
		fontWeight: fontWeight.bold,
		lineHeight: lineHeight.h2,
		color: colors.neutral.textPrimary,
	},
	h3: {
		fontFamily: fontFamily.semiBold,
		fontSize: fontSize.h3,
		fontWeight: fontWeight.semiBold,
		lineHeight: lineHeight.h3,
		color: colors.neutral.textPrimary,
	},
	h4: {
		fontFamily: fontFamily.medium,
		fontSize: fontSize.h4,
		fontWeight: fontWeight.medium,
		lineHeight: lineHeight.h4,
		color: colors.neutral.textPrimary,
	},
	bodyLg: {
		fontFamily: fontFamily.regular,
		fontSize: fontSize.bodyLg,
		fontWeight: fontWeight.regular,
		lineHeight: lineHeight.bodyLg,
		color: colors.neutral.textPrimary,
	},
	bodyMd: {
		fontFamily: fontFamily.regular,
		fontSize: fontSize.bodyMd,
		fontWeight: fontWeight.regular,
		lineHeight: lineHeight.bodyMd,
		color: colors.neutral.textPrimary,
	},
	bodySm: {
		fontFamily: fontFamily.regular,
		fontSize: fontSize.bodySm,
		fontWeight: fontWeight.regular,
		lineHeight: lineHeight.bodySm,
		color: colors.neutral.textSecondary,
	},
	caption: {
		fontFamily: fontFamily.regular,
		fontSize: fontSize.caption,
		fontWeight: fontWeight.regular,
		lineHeight: lineHeight.caption,
		color: colors.neutral.textMuted,
	},
} as const;
