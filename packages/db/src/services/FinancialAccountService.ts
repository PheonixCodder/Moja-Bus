import { PrismaClient, AccountOwnerType, AccountCategory } from "@prisma/client";

export class FinancialAccountService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Retrieves or creates the system-level clearing account for Paystack incoming funds.
   */
  async getSystemPaystackClearingAccount() {
    return this.getOrCreateAccount({
      ownerType: "SYSTEM",
      ownerId: "system",
      accountCategory: "ASSET",
      accountClass: "PAYSTACK_CLEARING",
      allowNegativeBalance: true, // Clearing accounts often swing negative temporarily before settlement
    });
  }

  /**
   * Retrieves or creates the platform revenue account.
   */
  async getPlatformRevenueAccount() {
    return this.getOrCreateAccount({
      ownerType: "PLATFORM",
      ownerId: "moja_ride",
      accountCategory: "REVENUE",
      accountClass: "PLATFORM_FEES",
    });
  }

  /**
   * Retrieves or creates an operator's receivable account.
   */
  async getOperatorReceivableAccount(companyId: string) {
    return this.getOrCreateAccount({
      ownerType: "COMPANY",
      ownerId: companyId,
      accountCategory: "LIABILITY", // Liability from the platform's perspective (money we owe the operator)
      accountClass: "OPERATOR_RECEIVABLE",
    });
  }

  /**
   * Retrieves or creates a user's wallet.
   */
  async getUserWallet(userId: string) {
    return this.getOrCreateAccount({
      ownerType: "USER",
      ownerId: userId,
      accountCategory: "LIABILITY", // Liability from the platform's perspective (money we owe the user)
      accountClass: "PASSENGER_WALLET",
    });
  }

  private async getOrCreateAccount(params: {
    ownerType: AccountOwnerType;
    ownerId: string;
    accountCategory: AccountCategory;
    accountClass: string;
    allowNegativeBalance?: boolean;
  }) {
    const existing = await this.prisma.financialAccount.findFirst({
      where: {
        ownerType: params.ownerType,
        ownerId: params.ownerId,
        accountClass: params.accountClass,
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.financialAccount.create({
      data: {
        ownerType: params.ownerType,
        ownerId: params.ownerId,
        accountCategory: params.accountCategory,
        accountClass: params.accountClass,
        allowNegativeBalance: params.allowNegativeBalance ?? false,
      },
    });
  }
}
