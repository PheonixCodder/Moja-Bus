// ==============================================================================
// Moja Booth Design Tokens (apps/booth-app/constants/theme.ts)
// Directly binds and re-exports from the canonical @moja/theme/tokens system.
// Booth App uses LIGHT MODE exclusively (userInterfaceStyle: "light" in app.json).
// ==============================================================================
import {
  Colors,
  ControlHeights,
  FontFamily,
  FontSize,
  FontWeight,
  LineHeight,
  Palette,
  Radii,
  Spacing,
  TextStyles,
} from "@moja/theme/tokens";

export {
  Colors,
  ControlHeights,
  FontFamily,
  FontSize,
  FontWeight,
  LineHeight,
  Palette,
  Radii,
  Spacing,
  TextStyles,
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
