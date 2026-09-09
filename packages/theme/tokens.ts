// ==============================================================================
// Moja Ride Canonical Design Tokens (@moja/theme/tokens)
// Single Source of Truth for Web (Next.js), Mobile (Expo), and Design System UI.
// ==============================================================================

/**
 * Global Color Palette (Tier 1: Primitives)
 */
export const Palette = {
  rose: {
    50: "#fff1f2",
    100: "#ffe4e6",
    200: "#fecdd3",
    300: "#fda4af",
    400: "#fb7185",
    500: "#ee237c", // Moja Brand Primary
    600: "#be123c", // Dark / Pressed
    700: "#9f1239",
    800: "#881337",
    900: "#4c0519",
  },
  emerald: {
    50: "#ecfdf5",
    500: "#10b981", // Semantic Success
    600: "#059669",
    700: "#047857",
  },
  amber: {
    50: "#fffbeb",
    500: "#f59e0b", // Semantic Warning
    600: "#d97706",
  },
  orange: {
    500: "#f97316", // Streak / Reward accent
    600: "#ea6c0a",
  },
  red: {
    50: "#fef2f2",
    500: "#ef4444", // Semantic Destructive / Error
    600: "#dc2626",
  },
  blue: {
    50: "#eff6ff",
    500: "#3b82f6", // Semantic Info
    600: "#2563eb",
  },
  zinc: {
    50: "#fafafa",
    100: "#f4f4f5",
    200: "#e4e4e7",
    300: "#d4d4d8",
    400: "#a1a1aa",
    500: "#71717a",
    600: "#52525b",
    700: "#3f3f46",
    800: "#27272a",
    900: "#18181b",
    950: "#09090b",
  },
} as const;

export const primaryRGB = "238, 35, 124";

/**
 * Semantic Theme Colors (Tier 2: Light & Dark Modes)
 */
export const Colors = {
  light: {
    // Canvas & Surfaces
    background: "#ffffff",
    surface: "#ffffff",
    card: "#ffffff",
    cardElevated: "#f4f4f5",
    backgroundElement: "#f4f4f5",
    backgroundSelected: "#e4e4e7",
    muted: "#f4f4f5",
    border: "#e4e4e7",
    borderStrong: "#d4d4d8",

    // Typography
    text: "#18181b",
    textPrimary: "#18181b",
    textSecondary: "#71717a",
    textMuted: "#a1a1aa",

    // Brand Actions
    primary: Palette.rose[500],
    primaryDark: Palette.rose[600],
    primaryForeground: "#ffffff",

    // Reward / Gamification
    streak: Palette.orange[500],      // "#f97316" — always orange in both modes

    // Functional Statuses
    success: Palette.emerald[500],
    successSubtle: Palette.emerald[50],
    successForeground: "#ffffff",

    warning: Palette.amber[500],
    warningSubtle: Palette.amber[50],
    warningForeground: "#18181b",

    destructive: Palette.red[500],
    destructiveSubtle: Palette.red[50],
    destructiveForeground: "#ffffff",

    info: Palette.blue[500],
    infoSubtle: Palette.blue[50],
    infoForeground: "#ffffff",
  },
  dark: {
    // Canvas & Surfaces (OLED optimized for vehicle cockpit and dark mode)
    background: "#09090b",
    surface: "#18181b",
    card: "#18181b",
    cardElevated: "#27272a",
    backgroundElement: "#27272a",
    backgroundSelected: "#3f3f46",
    muted: "#27272a",
    border: "#27272a",
    borderStrong: "#3f3f46",

    // Typography
    text: "#fafafa",
    textPrimary: "#fafafa",
    textSecondary: "#a1a1aa",
    textMuted: "#71717a",

    // Brand Actions
    primary: Palette.rose[500],
    primaryDark: Palette.rose[600],
    primaryForeground: "#ffffff",

    // Reward / Gamification
    streak: Palette.orange[500],      // "#f97316" — always orange in both modes

    // Functional Statuses
    success: Palette.emerald[500],
    successSubtle: "#064e3b",
    successForeground: "#ffffff",

    warning: Palette.amber[500],
    warningSubtle: "#78350f",
    warningForeground: "#ffffff",

    destructive: Palette.red[500],
    destructiveSubtle: "#7f1d1d",
    destructiveForeground: "#ffffff",

    info: Palette.blue[500],
    infoSubtle: "#1e3a8a",
    infoForeground: "#ffffff",
  },
} as const;

export type ThemeMode = "light" | "dark";
export type ThemeColor = keyof typeof Colors.light;

/**
 * Typography Scale & Font Families
 * Aligned across Web (Next.js) and Mobile (Expo)
 * Body / Sans: Outfit | Headings / Display: Raleway
 */
export const FontFamily = {
  // Primary UI Sans (Outfit)
  regular: "Outfit",
  medium: "Outfit-Medium",
  semiBold: "Outfit-SemiBold",
  bold: "Outfit-Bold",
  extraBold: "Outfit-ExtraBold",
  black: "Outfit-Black",
  // Headings & Display (Raleway)
  headingRegular: "Raleway",
  headingMedium: "Raleway-Medium",
  headingSemiBold: "Raleway-SemiBold",
  headingBold: "Raleway-Bold",
  headingExtraBold: "Raleway-ExtraBold",
  headingBlack: "Raleway-Black",
} as const;

export const FontSize = {
  display: 32,
  h1: 28,
  h2: 22,
  h3: 18,
  h4: 15,
  bodyLg: 16,
  bodyMd: 14,
  bodySm: 12,
  caption: 11,
  micro: 10,
} as const;

export const LineHeight = {
  display: 40,
  h1: 34,
  h2: 28,
  h3: 24,
  h4: 20,
  bodyLg: 24,
  bodyMd: 20,
  bodySm: 18,
  caption: 15,
  micro: 14,
} as const;

export const FontWeight = {
  regular: "400",
  medium: "500",
  semiBold: "600",
  bold: "700",
} as const;

/**
 * Universal Fonts export for platform compatibility
 */
export const Fonts = {
  sans: "Outfit",
  heading: "Raleway",
  serif: "Georgia, serif",
  rounded: "SF Pro Rounded, normal",
  mono: "ui-monospace, monospace",
};

/**
 * Mathematical Spacing Scale (4px base)
 */
export const Spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  // Backward-compatibility aliases for legacy imports
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/**
 * Corner Radius Scale — Mobile (Expo / NativeWind)
 * Matches --radius: 1rem override in apps/driver-app and apps/traveler-app global.css.
 * Web uses its own radius derivation from packages/ui/src/styles/style-maia.css.
 *
 * --radius-sm  = 1rem - 4px = 12px
 * --radius-md  = 1rem - 2px = 14px
 * --radius-lg  = 1rem       = 16px
 * --radius-xl  = 1rem + 4px = 20px  ← matches rounded-[20px] feature screens
 * --radius-2xl = 1rem + 8px = 24px
 * --radius-3xl = 1rem + 12px= 28px
 * --radius-4xl = 1rem + 16px= 32px
 */
export const Radii = {
  none: 0,
  xs:   4,
  sm:   12,
  md:   14,
  lg:   16,
  xl:   20,
  "2xl": 24,
  "3xl": 28,
  "4xl": 32,
  full: 9999,
} as const;

/**
 * Standard Control Heights & Touch Ergonomics
 */
export const ControlHeights = {
  button: {
    sm: 36,
    md: 40,
    lg: 48,
    cockpit: 56, // In-cab tactical touch target
  },
  input: {
    sm: 36,
    md: 40,
    lg: 48,
    cockpit: 56,
  },
  touchTargetMin: 44,       // Standard WCAG 2.1 AA mobile touch target
  cockpitTouchTargetMin: 48,// High-velocity vehicle touch target
} as const;

/**
 * Pre-composed Text Styles for Mobile Views
 */
export const TextStyles = {
  h1: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.h1,
    fontWeight: FontWeight.bold,
    lineHeight: LineHeight.h1,
  },
  h2: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.h2,
    fontWeight: FontWeight.bold,
    lineHeight: LineHeight.h2,
  },
  h3: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.h3,
    fontWeight: FontWeight.semiBold,
    lineHeight: LineHeight.h3,
  },
  h4: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.h4,
    fontWeight: FontWeight.medium,
    lineHeight: LineHeight.h4,
  },
  bodyLg: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyLg,
    fontWeight: FontWeight.regular,
    lineHeight: LineHeight.bodyLg,
  },
  bodyMd: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
    fontWeight: FontWeight.regular,
    lineHeight: LineHeight.bodyMd,
  },
  bodySm: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    fontWeight: FontWeight.regular,
    lineHeight: LineHeight.bodySm,
  },
  caption: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.regular,
    lineHeight: LineHeight.caption,
  },
  micro: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.micro,
    fontWeight: FontWeight.semiBold,
    lineHeight: LineHeight.micro,
  },
} as const;
