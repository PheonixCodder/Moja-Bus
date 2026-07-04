/**
 * Stub: re-encrypt all bank accounts after key rotation.
 *
 * Usage (from repo root, with DATABASE_URL and keys set):
 *   node apps/web/scripts/reencrypt-bank-accounts.mjs
 *
 * Set BANK_ENCRYPTION_KEY_PREVIOUS to the old key and BANK_ENCRYPTION_KEY to the new key
 * before running. Remove BANK_ENCRYPTION_KEY_PREVIOUS after all rows show enc:v1: ciphertext.
 */

console.log(
  "reencrypt-bank-accounts: implement batch read/decrypt/encrypt when production data exists.",
);
console.log(
  "See apps/web/docs/bank-encryption.md for the rotation procedure.",
);
