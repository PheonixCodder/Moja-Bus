import { PrismaClient } from "@prisma/client";

/**
 * SnapshotService
 *
 * Generates point-in-time balance snapshots for every active FinancialAccount.
 * The snapshot captures the current READ MODEL values (postedBalance,
 * reservedBalance, availableBalance) stored on the account itself — these are
 * maintained exclusively by AccountingEngine, so no aggregation is needed here.
 *
 * Snapshots allow dashboards to query historical balances in O(1) per period
 * rather than replaying the entire ledger every time.
 *
 * Usage:
 *   const svc = new SnapshotService(prisma);
 *   await svc.takeDaily();   // called by cron
 *   await svc.takeWeekly();  // called by cron
 *   await svc.takeMonthly(); // called by cron
 */
export class SnapshotService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Snapshot all active accounts for a given period at a given date.
   * Uses upsert with the @@unique([accountId, period, snapshotDate]) constraint,
   * so re-running is idempotent — a second call on the same day just updates
   * the values to reflect any new postings since the first run.
   */
  async take(period: "DAILY" | "WEEKLY" | "MONTHLY", snapshotDate: Date): Promise<{ count: number }> {
    // Truncate time portion so the unique key is stable within the period
    const dateOnly = new Date(
      Date.UTC(
        snapshotDate.getUTCFullYear(),
        snapshotDate.getUTCMonth(),
        snapshotDate.getUTCDate(),
      ),
    );

    const accounts = await this.prisma.financialAccount.findMany({
      where: { status: { not: "CLOSED" } },
      select: {
        id: true,
        postedBalance: true,
        reservedBalance: true,
        availableBalance: true,
      },
    });

    if (accounts.length === 0) return { count: 0 };

    // Batch upserts — each account gets one snapshot row per (period, date)
    await this.prisma.$transaction(
      accounts.map((acct) =>
        this.prisma.financialAccountSnapshot.upsert({
          where: {
            accountId_period_snapshotDate: {
              accountId: acct.id,
              period,
              snapshotDate: dateOnly,
            },
          },
          create: {
            accountId: acct.id,
            period,
            snapshotDate: dateOnly,
            postedBalance: acct.postedBalance,
            reservedBalance: acct.reservedBalance,
            availableBalance: acct.availableBalance,
          },
          update: {
            postedBalance: acct.postedBalance,
            reservedBalance: acct.reservedBalance,
            availableBalance: acct.availableBalance,
          },
        }),
      ),
    );

    return { count: accounts.length };
  }

  async takeDaily(date: Date = new Date()): Promise<{ count: number }> {
    return this.take("DAILY", date);
  }

  async takeWeekly(date: Date = new Date()): Promise<{ count: number }> {
    return this.take("WEEKLY", date);
  }

  async takeMonthly(date: Date = new Date()): Promise<{ count: number }> {
    return this.take("MONTHLY", date);
  }

  /**
   * Retrieve the most recent snapshot for a given account and period.
   * Useful for dashboard "closing balance" cards without touching the ledger.
   */
  async getLatest(accountId: string, period: "DAILY" | "WEEKLY" | "MONTHLY") {
    return this.prisma.financialAccountSnapshot.findFirst({
      where: { accountId, period },
      orderBy: { snapshotDate: "desc" },
    });
  }

  /**
   * Retrieve a time-series of snapshots for charting.
   * Returns up to `limit` snapshots (default 30) ordered oldest-first.
   */
  async getTimeSeries(
    accountId: string,
    period: "DAILY" | "WEEKLY" | "MONTHLY",
    limit = 30,
  ) {
    const rows = await this.prisma.financialAccountSnapshot.findMany({
      where: { accountId, period },
      orderBy: { snapshotDate: "desc" },
      take: limit,
      select: {
        snapshotDate: true,
        postedBalance: true,
        reservedBalance: true,
        availableBalance: true,
      },
    });
    // BigInt fields must be serialized before returning to JSON consumers
    return rows
      .reverse()
      .map((r) => ({
        snapshotDate: r.snapshotDate,
        postedBalance: r.postedBalance.toString(),
        reservedBalance: r.reservedBalance.toString(),
        availableBalance: r.availableBalance.toString(),
      }));
  }
}
