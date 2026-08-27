# Bank account encryption

Operator settlement bank account numbers are encrypted at rest using AES-256-GCM.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BANK_ENCRYPTION_KEY` | Yes | Base64-encoded 32-byte key used for encryption |
| `BANK_ENCRYPTION_KEY_PREVIOUS` | No | Previous key kept during rotation for decrypt-only |

Generate a key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Storage format

- `BankAccount.accountNumber` stores ciphertext prefixed with `enc:v1:`
- `BankAccount.accountNumberLast4` stores the last four digits for masked display
- Legacy plaintext rows are still readable and are encrypted on the next write

## API behavior

- `operator.getSettings` and `operator.getOnboardingStatus` return masked account numbers
- `operator.revealBankAccount` (OWNER only) decrypts and logs `VIEW_FULL` to `bank_access_log`
- `operator.updateBank` and onboarding bank saves encrypt before persistence and log `CREATE` / `UPDATE`

## Key rotation procedure

1. Set `BANK_ENCRYPTION_KEY_PREVIOUS` to the current `BANK_ENCRYPTION_KEY`
2. Deploy a new `BANK_ENCRYPTION_KEY`
3. Run a re-encryption job that reads each bank account, decrypts with either key, and writes back with the new key
4. After all rows are re-encrypted, remove `BANK_ENCRYPTION_KEY_PREVIOUS`

A rotation script stub can be added under `apps/web/scripts/reencrypt-bank-accounts.mjs` when production data exists.

## Incident response

- Revoke non-owner access to `revealBankAccount` (enforced in router)
- Rotate `BANK_ENCRYPTION_KEY` if key material may be compromised
- Review `bank_access_log` for unexpected `VIEW_FULL` events
