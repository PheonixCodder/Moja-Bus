// ============================================================
// Booth App - Navigation Theme
// Fully aligned with @moja/theme/tokens. Single source of truth.
// Primary uses Moja brand rose (#ee237c), not shadcn default black.
// ============================================================

import { DefaultTheme, type Theme } from "expo-router/react-navigation";
import { Colors, Palette } from "@moja/theme/tokens";

export const NAV_THEME: Theme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.light.background, // "#ffffff"
    card: Colors.light.card, // "#ffffff"
    text: Colors.light.textPrimary, // "#18181b"
    border: Colors.light.border, // "#e4e4e7"
    primary: Palette.rose[500], // "#ee237c" - Moja brand pink
    notification: Palette.rose[500], // "#ee237c"
  },
};
