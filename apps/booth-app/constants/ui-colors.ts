// ==============================================================================
// Moja Booth — UI Colour Constants (constants/ui-colors.ts)
// Light-mode icon and placeholder colours, sourced from @moja/theme/tokens.
// These provide a single import point for icon `color` props and
// `placeholderTextColor` props so they stay consistent with the token system.
// ==============================================================================
import { Colors, Palette } from "@/constants/theme";

/**
 * Semantic icon colours for HugeiconsIcon `color` prop.
 * All values resolve to the canonical light-mode palette.
 */
export const IconColors = {
  /** Moja brand pink — CTAs, active states */
  brand: Palette.rose[500],
  /** Default foreground — back arrows, neutral icons */
  default: Colors.light.textPrimary,
  /** Muted neutral — secondary icons, placeholders */
  muted: Colors.light.textMuted,
  /** Success / cash / green semantic */
  success: Palette.emerald[600],
  /** Info / mobile-payment / blue semantic */
  info: Palette.blue[600],
  /** Warning / offline / amber semantic */
  warning: Palette.amber[500],
  /** Error / destructive / red semantic */
  error: Palette.red[500],
  /** White — icons on dark/primary backgrounds */
  onPrimary: "#ffffff" as const,
} as const;

/**
 * Standard placeholder text colour for TextInput components.
 * Matches the muted-foreground token for the light theme.
 */
export const PlaceholderColor = Colors.light.textMuted;
