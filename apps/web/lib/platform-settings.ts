import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@moja/db";

type SettingsContext = {
  prisma: PrismaClient;
  user: { id: string };
};

type SettingKey =
    | "default_commission_bps"
    | "default_convenience_fee_bps"
    | "min_withdrawal_amount"
    | "withdrawal_frequency_hours"
    | "require_2fa_for_withdrawals";

const FIELD_MAP: Record<SettingKey, string> = {
  default_commission_bps: "defaultCommissionBps",
  default_convenience_fee_bps: "defaultConvenienceFeeBps",
  min_withdrawal_amount: "minWithdrawalAmount",
  withdrawal_frequency_hours: "withdrawalFrequencyHours",
  require_2fa_for_withdrawals: "require2FAForWithdrawals",
};

export class PlatformSettingsManager {
  constructor(private prisma: PrismaClient, private userId: string) {}

  async setSetting(
      key: SettingKey,
      value: number | boolean,
      metadata: { setBy: string; changeReason: string }
  ): Promise<void> {
    const field = FIELD_MAP[key];
    if (!field) {
      throw new TRPCError({ code: "BAD_REQUEST", message: `Invalid setting key: ${key}` });
    }

    this.validateSettingValue(key, value);

    const oldValue = await this.getCurrentValue(key);

    await this.prisma.$transaction([
      this.prisma.platformSettings.upsert({
        where: { id: "default" },
        create: { id: "default", [field]: value },
        update: { [field]: value },
      }),
      this.prisma.platformSettingsAudit.create({
        data: {
          settingKey: key,
          oldValue: oldValue as any,
          newValue: value as any,
          changedById: metadata.setBy,
          changeReason: metadata.changeReason,
        },
      }),
    ]);
  }

  private async getCurrentValue(key: SettingKey): Promise<number | boolean | null> {
    const settings = await this.prisma.platformSettings.findUnique({ where: { id: "default" } });
    if (!settings) return null;
    const field = FIELD_MAP[key];
    return (settings as any)[field] ?? null;
  }

  private validateSettingValue(key: SettingKey, value: number | boolean): void {
    switch (key) {
      case "default_commission_bps":
        if (typeof value !== "number" || value < 100 || value > 1500) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Commission rate must be between 1% and 15%" });
        }
        break;
      case "default_convenience_fee_bps":
        if (typeof value !== "number" || value < 0 || value > 1000) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Convenience fee rate must be between 0% and 10%" });
        }
        break;
      case "min_withdrawal_amount":
        if (typeof value !== "number" || value < 1000 || value > 100000) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Minimum withdrawal must be between 1,000 and 100,000 XOF" });
        }
        break;
      case "withdrawal_frequency_hours":
        if (typeof value !== "number" || value < 1 || value > 168) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Withdrawal frequency must be between 1 and 168 hours" });
        }
        break;
      case "require_2fa_for_withdrawals":
        if (typeof value !== "boolean") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "This setting must be true or false" });
        }
        break;
    }
  }

  async getSettingsHistory(limit = 50) {
    return this.prisma.platformSettingsAudit.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { changedByUser: { select: { id: true, email: true, role: true } } },
    });
  }
}

export function createSettingsManager(ctx: SettingsContext): PlatformSettingsManager {
  return new PlatformSettingsManager(ctx.prisma, ctx.user.id);
}

export const PLATFORM_CONSTANTS = {
  MIN_SETTLEMENT_AMOUNT: 10000,
  MAX_SETTLEMENT_AMOUNT: 50000000,
  DEFAULT_COMMISSION_BPS: 500,
  DEFAULT_CONVENIENCE_FEE_BPS: 250,
  SETTLEMENT_PROCESSING_WINDOW_HOURS: 24,
  MAX_DAILY_SETTLEMENT_COUNT: 10,
} as const;