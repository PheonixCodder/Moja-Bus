// ============================================================
// Traveler App — JS Colour Constants for Non-CSS Contexts
//
// Use for: icon color props, placeholderTextColor,
// Switch trackColor/thumbColor, ActivityIndicator color.
//
// Do NOT use for NativeWind className props — use CSS tokens there.
// Rule: Any value here must come from @moja/theme/tokens — no raw hex.
// ============================================================

import { Palette, Colors } from "@moja/theme/tokens";

/**
 * Icon colours for the traveler app (always light mode).
 * Pass to HugeiconsIcon `color`, Lucide icon `color`, etc.
 */
export const IconColors = {
	default:    Colors.light.textPrimary,    // "#18181b"
	secondary:  Colors.light.textSecondary,  // "#71717a"
	muted:      Colors.light.textMuted,      // "#a1a1aa"
	brand:      Palette.rose[500],           // "#ee237c"
	onBrand:    "#ffffff",                   // white icon on primary-coloured backgrounds
	onCard:     Colors.light.card,           // "#ffffff" — icon inside coloured button
	success:    Palette.emerald[500],        // "#10b981"
	warning:    Palette.amber[500],          // "#f59e0b"
	error:      Palette.red[500],            // "#ef4444"
	info:       Palette.blue[500],           // "#3b82f6"
} as const;

/**
 * Switch / Toggle component colours.
 * Pass to Switch `trackColor` and `thumbColor` props.
 */
export const SwitchColors = {
	trackOff:      Colors.light.borderStrong,    // "#d4d4d8"
	trackOn:       Palette.rose[500],            // "#ee237c"
	trackOnSubtle: Palette.rose[200],            // "#fecdd3"
	thumb:         Colors.light.background,      // "#ffffff"
	thumbActive:   Palette.rose[500],            // "#ee237c"
} as const;

/**
 * TextInput placeholder colour.
 * Pass to TextInput `placeholderTextColor` prop.
 */
export const PlaceholderColor = Colors.light.textMuted; // "#a1a1aa"
