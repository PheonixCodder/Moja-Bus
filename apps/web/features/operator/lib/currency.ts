import { formatXOF as formatXOFInternal, type XOFAmount } from "@/lib/money";

/** Format an XOF amount for display (English locale, grouped, "XOF" suffix). */
export function formatXOF(amount: XOFAmount): string {
  return formatXOFInternal(amount);
}
