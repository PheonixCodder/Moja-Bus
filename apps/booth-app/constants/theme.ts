// ==============================================================================
// Moja Booth Design Tokens (apps/booth-app/constants/theme.ts)
// Directly binds and re-exports from the canonical @moja/theme/tokens system.
// Booth App uses LIGHT MODE exclusively (userInterfaceStyle: "light" in app.json).
// ==============================================================================
import {
  Colors,
  ControlHeights,
  FontFamily,
  FontWeight,
  Palette,
  Radii,
  Spacing,
} from "@moja/theme/tokens";

// Compact/dense type scale — not importing FontSize/TextStyles/LineHeight
// from @moja/theme/tokens to avoid affecting @apps/web and @packages/ui.
const _FontSize = {
  h1: 32,
  h2: 24,
  h3: 20,
  h4: 16,
  bodyLg: 16,
  bodyMd: 14,
  bodySm: 13,
  caption: 11,
} as const;

const _LineHeight = {
  h1: 38,
  h2: 30,
  h3: 26,
  h4: 22,
  bodyLg: 22,
  bodyMd: 20,
  bodySm: 18,
  caption: 15,
} as const;

export const FontSize = _FontSize;
export const LineHeight = _LineHeight;
export const TextStyles = {
  h1: {
    fontFamily: FontFamily.bold,
    fontSize: _FontSize.h1,
    fontWeight: FontWeight.bold,
    lineHeight: _LineHeight.h1,
  },
  h2: {
    fontFamily: FontFamily.bold,
    fontSize: _FontSize.h2,
    fontWeight: FontWeight.bold,
    lineHeight: _LineHeight.h2,
  },
  h3: {
    fontFamily: FontFamily.semiBold,
    fontSize: _FontSize.h3,
    fontWeight: FontWeight.semiBold,
    lineHeight: _LineHeight.h3,
  },
  h4: {
    fontFamily: FontFamily.medium,
    fontSize: _FontSize.h4,
    fontWeight: FontWeight.medium,
    lineHeight: _LineHeight.h4,
  },
  bodyLg: {
    fontFamily: FontFamily.regular,
    fontSize: _FontSize.bodyLg,
    fontWeight: FontWeight.regular,
    lineHeight: _LineHeight.bodyLg,
  },
  bodyMd: {
    fontFamily: FontFamily.regular,
    fontSize: _FontSize.bodyMd,
    fontWeight: FontWeight.regular,
    lineHeight: _LineHeight.bodyMd,
  },
  bodySm: {
    fontFamily: FontFamily.regular,
    fontSize: _FontSize.bodySm,
    fontWeight: FontWeight.regular,
    lineHeight: _LineHeight.bodySm,
  },
  caption: {
    fontFamily: FontFamily.regular,
    fontSize: _FontSize.caption,
    fontWeight: FontWeight.regular,
    lineHeight: _LineHeight.caption,
  },
  micro: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    fontWeight: FontFamily.semiBold === "Outfit-SemiBold" ? "600" : "600",
    lineHeight: 15,
  },
} as const;

export {
  Colors,
  ControlHeights,
  FontFamily,
  FontWeight,
  Palette,
  Radii,
  Spacing,
};

// Booth-specific semantic tokens mapped to canonical light theme
export const colors = {
  primary: {
    rose: Palette.rose[500],
    deepRose: Palette.rose[600],
    emerald: Palette.emerald[500],
    blue: Palette.blue[500],
  },
  semantic: {
    success: Palette.emerald[500],
    warning: Palette.amber[500],
    // Ticket and cash use the same emerald-500 green as success
    ticket: Palette.emerald[500],
    cash: Palette.emerald[500],
    // Paystack brand blue — third-party colour, intentionally not in Moja palette
    paystack: "#0065ff" as const,
    error: Palette.red[500],
    info: Palette.blue[500],
    // Service types for badge and schedule tags
    intercity: {
      main: Palette.blue[500],
      bg: Palette.blue[50],
      text: Palette.blue[600],
      border: "#bfdbfe",
    },
    urban: {
      main: Palette.orange[500],
      bg: Palette.amber[50],
      text: Palette.orange[600],
      border: "#fde68a",
    },
    // Offline status & pool reserve tokens
    offline: {
      main: Palette.amber[500],
      bg: Palette.amber[50],
      text: Palette.amber[600],
      border: "#fcd34d",
    },
    // Seat states for interactive seat maps
    seat: {
      available: Palette.emerald[500],
      availableBg: Palette.emerald[50],
      availableBorder: Palette.emerald[500],
      selected: Palette.rose[500],
      selectedBg: Palette.rose[500],
      selectedText: "#ffffff",
      held: Palette.amber[500],
      heldBg: Palette.amber[50],
      heldBorder: Palette.amber[500],
      sold: Palette.zinc[300],
      soldBg: Palette.zinc[100],
      soldText: Palette.zinc[400],
      driver: Colors.light.textPrimary,
    },
  },
  neutral: {
    background: Colors.light.background,
    surface: Colors.light.surface,
    elevated: Colors.light.cardElevated,
    border: Colors.light.border,
    borderStrong: Colors.light.borderStrong,
    textPrimary: Colors.light.textPrimary,
    textSecondary: Colors.light.textSecondary,
    textMuted: Colors.light.textMuted,
  },
} as const;

export type ThemeColors = typeof colors;
export type AppColors = typeof colors;

/** Minimum touch target height (48px) for rapid booth operator tapping */
export const TouchTargetMinHeight = 48;
export const TouchTargetSmallMinHeight = 44;
export const MaxContentWidth = 800;

export const fontFamily = FontFamily;

export const fontSize = {
  h1: FontSize.h1,
  h2: FontSize.h2,
  h3: FontSize.h3,
  h4: FontSize.h4,
  bodyLg: FontSize.bodyLg,
  bodyMd: FontSize.bodyMd,
  bodySm: FontSize.bodySm,
  caption: FontSize.caption,
} as const;

export const lineHeight = {
  h1: LineHeight.h1,
  h2: LineHeight.h2,
  h3: LineHeight.h3,
  h4: LineHeight.h4,
  bodyLg: LineHeight.bodyLg,
  bodyMd: LineHeight.bodyMd,
  bodySm: LineHeight.bodySm,
  caption: LineHeight.caption,
} as const;

export const fontWeight = FontWeight;

export const textStyles = {
  h1: {
    ...TextStyles.h1,
    color: colors.neutral.textPrimary,
  },
  h2: {
    ...TextStyles.h2,
    color: colors.neutral.textPrimary,
  },
  h3: {
    ...TextStyles.h3,
    color: colors.neutral.textPrimary,
  },
  h4: {
    ...TextStyles.h4,
    color: colors.neutral.textPrimary,
  },
  bodyLg: {
    ...TextStyles.bodyLg,
    color: colors.neutral.textPrimary,
  },
  bodyMd: {
    ...TextStyles.bodyMd,
    color: colors.neutral.textPrimary,
  },
  bodySm: {
    ...TextStyles.bodySm,
    color: colors.neutral.textSecondary,
  },
  caption: {
    ...TextStyles.caption,
    color: colors.neutral.textMuted,
  },
} as const;
