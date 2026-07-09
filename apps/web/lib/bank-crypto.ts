import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

const PREFIX = "enc:v1:";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function parseEncryptionKey(raw: string, label: string): Buffer {
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(`${label} must be a base64-encoded 32-byte key`);
  }
  return key;
}

function getEncryptionKeys(): Buffer[] {
  const current = process.env["BANK_ENCRYPTION_KEY"];
  if (!current) {
    throw new Error("BANK_ENCRYPTION_KEY is not configured");
  }

  const keys = [parseEncryptionKey(current, "BANK_ENCRYPTION_KEY")];
  const previous = process.env["BANK_ENCRYPTION_KEY_PREVIOUS"];
  if (previous) {
    keys.push(parseEncryptionKey(previous, "BANK_ENCRYPTION_KEY_PREVIOUS"));
  }
  return keys;
}

export function isEncryptedAccountNumber(value: string): boolean {
  return value.startsWith(PREFIX);
}

export function maskAccountNumber(last4: string | null | undefined): string {
  const suffix = last4 && last4.length >= 4 ? last4.slice(-4) : "****";
  return `••••••${suffix}`;
}

export function encryptAccountNumber(plain: string): {
  ciphertext: string;
  last4: string;
} {
  const key = getEncryptionKeys()[0]!;
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, encrypted]).toString("base64");

  return {
    ciphertext: `${PREFIX}${payload}`,
    last4: plain.slice(-4),
  };
}

export function decryptAccountNumber(stored: string): string {
  if (!isEncryptedAccountNumber(stored)) {
    return stored;
  }

  const payload = Buffer.from(stored.slice(PREFIX.length), "base64");
  const iv = payload.subarray(0, IV_LENGTH);
  const tag = payload.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = payload.subarray(IV_LENGTH + TAG_LENGTH);

  for (const key of getEncryptionKeys()) {
    try {
      const decipher = createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(tag);
      return Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]).toString("utf8");
    } catch {
      // Try the next key during rotation windows.
    }
  }

  throw new Error("Failed to decrypt bank account number");
}

export function shouldReencryptAccountNumber(stored: string): boolean {
  return !isEncryptedAccountNumber(stored);
}
