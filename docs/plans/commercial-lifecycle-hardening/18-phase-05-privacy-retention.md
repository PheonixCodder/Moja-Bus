# Promotion hash & snapshot retention (P3-14)

## What we store

| Data | Where | Purpose |
|------|--------|---------|
| `deviceHash` | ReferralEdge, DiscountRedemption, claim audit (`PromoAbuseEvent` CREDIT_GRANT_CLAIM) | Same-device abuse blocks |
| `ipHash` (when collected) | Referral / abuse metadata | Velocity / fraud review |
| `snapshotJson` | DiscountRedemption | Reconstruct freeze for disputes |

## Retention policy

- **Active + 24 months** after redemption FINALIZED or referral edge terminal status: keep hashes + snapshots for fraud review and finance audit.
- **After 24 months:** anonymize hashes (`deviceHash`/`ipHash` → null) and replace `snapshotJson` with `{ redacted: true, at: ISO }` via optional cron (Phase 06/07 if not shipped here).
- **Abuse events:** keep `reviewStatus` + resolution notes indefinitely; redact PII in metadata on the same schedule.

## Operator guidance

Do not export raw hashes in marketing CSVs served to operators (already privacy-filtered on operator redemption list).
