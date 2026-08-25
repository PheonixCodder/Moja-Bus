import { createHash } from "node:crypto";

/**
 * Phase 14/20 (F-NF-04) — recipient-scoped idempotency keys.
 *
 * Multi-recipient fan-outs that share one base key silently drop every
 * recipient after the first: the outbox unique-constraint treats recipient #2
 * as a duplicate of recipient #1. Suffixing a short deterministic tag of the
 * subscriber id makes each recipient's message distinct while keeping retries
 * of the SAME recipient deduped.
 *
 * The tag is a truncated SHA-256 rather than the raw id: bounded length
 * (Novu constrains transactionIds) and no user identifiers leaked into
 * dead-letter exports. Pure + unit-tested in tx-id.test.ts.
 */
export function recipientTag(subscriberId: string): string {
  return createHash("sha256").update(subscriberId).digest("hex").slice(0, 8);
}

export function txIdWithRecipient(
  base: string,
  to?: { subscriberId?: string | undefined } | undefined,
): string {
  if (!to?.subscriberId) return base;
  return `${base}-${recipientTag(to.subscriberId)}`;
}
