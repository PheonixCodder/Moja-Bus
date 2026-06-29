import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#171717",
    background: "#ffffff",
    backgroundElement: "#f5f5f5",
    backgroundSelected: "#e5e5e5",
    textSecondary: "#737373",
    primary: "#ee237c",
    primaryForeground: "#ffffff",
  },
  dark: {
    text: "#fafafa",
    background: "#171717",
    backgroundElement: "#262626",
    backgroundSelected: "#404040",
    textSecondary: "#a3a3a3",
    primary: "#ee237c",
    primaryForeground: "#ffffff",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: "Montserrat",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "Montserrat",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "Montserrat, var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;
