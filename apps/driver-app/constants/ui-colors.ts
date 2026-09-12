// ============================================================
// Driver App — JS Colour Constants for Non-CSS Contexts
//
// Use for: icon color props, placeholderTextColor,
// Switch trackColor/thumbColor, ActivityIndicator color.
//
// Do NOT use for NativeWind className props — use CSS tokens there.
// Rule: Any value here must come from @moja/theme/tokens — no raw hex.
// ============================================================

import { Palette, Colors } from "@moja/theme/tokens";

/**
 * Icon colours for the driver app (always dark mode).
 * Pass to HugeiconsIcon `color`, Lucide icon `color`, etc.
 */
export const IconColors = {
	default:    Colors.dark.textPrimary,     // "#fafafa"
	secondary:  Colors.dark.textSecondary,   // "#a1a1aa"
	muted:      Colors.dark.textMuted,       // "#71717a"
	brand:      Palette.rose[500],           // "#ee237c"
	onBrand:    "#ffffff",                   // white icon on primary-coloured backgrounds
	success:    Palette.emerald[500],        // "#10b981"
	warning:    Palette.amber[500],          // "#f59e0b"
	error:      Palette.red[500],            // "#ef4444"
	info:       Palette.blue[500],           // "#3b82f6"
	streak:     Palette.orange[500],         // "#f97316"
} as const;

/**
 * Switch / Toggle component colours.
 */
export const SwitchColors = {
	trackOff:  Colors.dark.border,           // "#27272a"
	trackOn:   Palette.rose[500],            // "#ee237c"
	thumb:     Colors.dark.textPrimary,      // "#fafafa"
} as const;

/**
 * TextInput placeholder colour.
 */
export const PlaceholderColor = Colors.dark.textMuted; // "#71717a"
