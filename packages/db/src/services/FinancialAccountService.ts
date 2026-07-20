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
   * Retrieves or creates the platform commission revenue account.
   */
  async getPlatformCommissionRevenueAccount() {
    return this.getOrCreateAccount({
      ownerType: "PLATFORM",
      ownerId: "moja_ride",
      accountCategory: "REVENUE",
      accountClass: "COMMISSION_REVENUE",
    });
  }

  /**
   * Retrieves or creates the platform convenience fee revenue account.
   */
  async getPlatformConvenienceFeeRevenueAccount() {
    return this.getOrCreateAccount({
      ownerType: "PLATFORM",
      ownerId: "moja_ride",
      accountCategory: "REVENUE",
      accountClass: "CONVENIENCE_FEE_REVENUE",
    });
  }

  /**
   * Retrieves or creates the payment processor fees account.
   */
  async getPaymentProcessorFeeAccount() {
    return this.getOrCreateAccount({
      ownerType: "PLATFORM",
      ownerId: "moja_ride",
      accountCategory: "EXPENSE",
      accountClass: "PAYMENT_PROCESSOR_FEES",
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
      allowNegativeBalance: true, // Must be true: refunds must always succeed even if operator withdrew all funds
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

  /**
   * Platform clearing liability for offline (CASH/VOUCHER) passenger reimbursements.
   * Operator net is clawed back here; settlement to the passenger is offline.
   */
  async getOfflineRefundPayableAccount() {
    return this.getOrCreateAccount({
      ownerType: "PLATFORM",
      ownerId: "moja_ride",
      accountCategory: "LIABILITY",
      accountClass: "OFFLINE_REFUND_PAYABLE",
      allowNegativeBalance: true,
    });
  }

  private async getOrCreateAccount(params: {
    ownerType: AccountOwnerType;
    ownerId: string;
    accountCategory: AccountCategory;
    accountClass: string;
    allowNegativeBalance?: boolean;
  }) {
    return this.prisma.financialAccount.upsert({
      where: {
        ownerType_ownerId_accountCategory_accountClass_currency: {
          ownerType: params.ownerType,
          ownerId: params.ownerId,
          accountCategory: params.accountCategory,
          accountClass: params.accountClass,
          currency: "XOF",
        }
      },
      update: {},
      create: {
        ownerType: params.ownerType,
        ownerId: params.ownerId,
        accountCategory: params.accountCategory,
        accountClass: params.accountClass,
        allowNegativeBalance: params.allowNegativeBalance ?? false,
      },
    });
  }
}
