import {
  decryptAccountNumber,
  encryptAccountNumber,
  isEncryptedAccountNumber,
  maskAccountNumber,
} from "./bank-crypto";

type BankAccountRecord = {
  id: string;
  companyId: string;
  bankName: string;
  accountNumber: string;
  accountNumberLast4: string | null;
  accountName: string;
  branch: string | null;
  swiftCode: string | null;
  iban: string | null;
  isVerified: boolean;
  verifiedAt: Date | null;
  verifiedById: string | null;
  verificationDocumentId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function prepareBankAccountStorage(accountNumber: string) {
  if (isEncryptedAccountNumber(accountNumber)) {
    return {
      accountNumber,
      accountNumberLast4: null as string | null,
    };
  }

  const encrypted = encryptAccountNumber(accountNumber);
  return {
    accountNumber: encrypted.ciphertext,
    accountNumberLast4: encrypted.last4,
  };
}

export function maskBankAccountForClient<T extends BankAccountRecord>(
  bankAccount: T,
): T {
  const last4 =
    bankAccount.accountNumberLast4 ??
    (isEncryptedAccountNumber(bankAccount.accountNumber)
      ? null
      : bankAccount.accountNumber.slice(-4));

  return {
    ...bankAccount,
    accountNumber: maskAccountNumber(last4),
  };
}

export function revealBankAccountNumber(bankAccount: BankAccountRecord): string {
  return decryptAccountNumber(bankAccount.accountNumber);
}
