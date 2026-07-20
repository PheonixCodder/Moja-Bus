/**
 * XOF money handling.
 *
 * Financial balances live in Postgres as `BigInt` and are serialized as strings
 * at the tRPC boundary (see `getAccountSnapshot`). They must NEVER be coerced
 * with `Number(...)` for arithmetic or comparison — that silently loses
 * precision above 2^53. Parse/compare as `bigint`; convert to `number` only at
 * the very last moment for display/charting, and only after asserting the value
 * is within the safe-integer range.
 *
 * All user-facing formatting uses the English locale and the Abidjan timezone
 * (UTC+0, no DST) — the product rule for Moja Ride.
 */

import { APP_TIMEZONE } from "@/lib/timezone";

export type XOFAmount = bigint | string | number | null | undefined;

/** Parse any XOF amount representation into a `bigint` for safe arithmetic. */
export function toXOFBigInt(amount: XOFAmount): bigint {
  if (amount == null) return 0n;
  if (typeof amount === "bigint") return amount;
  if (typeof amount === "number") {
    if (!Number.isInteger(amount)) {
      throw new Error(`XOF amount must be an integer, received ${amount}`);
    }
    return BigInt(amount);
  }
  const trimmed = String(amount).trim();
  if (trimmed === "" || trimmed === "0") return 0n;
  return BigInt(trimmed);
}

/** Convert to `number` ONLY for display/charting; asserts safe-integer range. */
export function toSafeDisplayNumber(amount: XOFAmount): number {
  const value = toXOFBigInt(amount); // BigInt (e.g. 0n for a zero balance)
  // `value` is always a bigint. Compare in bigint space: Number.isSafeInteger
  // returns false for ANY bigint (including 0n), which would wrongly throw on a
  // zero balance. Safe-integer range is [-(2^53), 2^53].
  if (value < -(2n ** 53n) || value > 2n ** 53n) {
    // XOF values should never approach 2^53; if they do, it is a bug.
    throw new Error(
      `XOF amount ${value} exceeds the safe integer range for Number display`,
    );
  }
  return Number(value);
}

/** Format an XOF amount for display: "1,000 XOF" (English, grouped). */
export function formatXOF(amount: XOFAmount): string {
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(toSafeDisplayNumber(amount))} XOF`;
}

/** Compare two amounts; returns -1, 0, or 1. Safe for balance comparisons. */
export function compareXOF(a: XOFAmount, b: XOFAmount): number {
  const ba = toXOFBigInt(a);
  const bb = toXOFBigInt(b);
  return ba < bb ? -1 : ba > bb ? 1 : 0;
}

/** Sum a list of XOF amounts into a single `bigint`. */
export function sumXOF(amounts: XOFAmount[]): bigint {
  return amounts.reduce<bigint>((acc, a) => acc + toXOFBigInt(a), 0n);
}

export const XOF_LOCALE = "en-US";
export const XOF_TIMEZONE = APP_TIMEZONE;
