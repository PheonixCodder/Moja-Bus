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
