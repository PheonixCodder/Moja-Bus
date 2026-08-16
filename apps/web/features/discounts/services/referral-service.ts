import type { Prisma, PrismaClient } from "@moja/db";
import { TRPCError } from "@trpc/server";
import { displayName } from "../lib/privacy-display";

function randomCode(prefix: string, len = 6): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = prefix;
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

/**
 * Issues a personal welcome coupon from the program's referee campaign.
 * Best-effort: attribution still succeeds if minting fails.
 */
async function issueRefereeWelcomeCoupon(
  prisma: PrismaClient,
  input: { campaignId: string; refereeUserId: string; edgeId: string },
): Promise<string | null> {
  const campaign = await prisma.discountCampaign.findUnique({
    where: { id: input.campaignId },
    select: { id: true, status: true, ownerType: true },
  });
  if (!campaign || campaign.status !== "ACTIVE") return null;

  const existing = await prisma.couponCode.findFirst({
    where: {
      campaignId: input.campaignId,
      assignedUserId: input.refereeUserId,
      isActive: true,
    },
  });
  if (existing) return existing.code;

  for (let attempt = 0; attempt < 8; attempt++) {
    const code = randomCode("WL");
    try {
      const created = await prisma.couponCode.create({
        data: {
          campaignId: input.campaignId,
          code,
          assignedUserId: input.refereeUserId,
          maxRedemptions: 1,
        },
      });
      return created.code;
    } catch {
      // unique collision — retry
    }
  }
  return null;
}

export async function ensureReferralCode(
  prisma: PrismaClient,
  userId: string,
): Promise<{ code: string }> {
  const existing = await prisma.referralCode.findUnique({ where: { userId } });
  if (existing) return { code: existing.code };

  for (let attempt = 0; attempt < 8; attempt++) {
    const code = randomCode("MR");
    try {
      const created = await prisma.referralCode.create({
        data: { userId, code },
      });
      return { code: created.code };
    } catch {
      // unique collision — retry
    }
  }
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Could not allocate referral code",
  });
}

export async function applyReferralCode(
  prisma: PrismaClient,
  input: {
    refereeUserId: string;
    code: string;
    deviceHash?: string | undefined;
  },
): Promise<{ edgeId: string; welcomeCouponCode: string | null }> {
  const program = await prisma.referralProgram.findUnique({
    where: { id: "default" },
  });
  if (!program?.isActive) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Referral program is inactive",
    });
  }

  const referralCode = await prisma.referralCode.findUnique({
    where: { code: input.code.toUpperCase() },
    include: { user: { select: { id: true, phoneNumber: true } } },
  });
  if (!referralCode) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid referral code" });
  }

  if (program.selfReferralBlock && referralCode.userId === input.refereeUserId) {
    await prisma.promoAbuseEvent.create({
      data: {
        eventType: "SELF_REFERRAL",
        userId: input.refereeUserId,
        metadata: { code: input.code },
      },
    });
    throw new TRPCError({ code: "BAD_REQUEST", message: "Self-referral is not allowed" });
  }

  const existing = await prisma.referralEdge.findUnique({
    where: { refereeUserId: input.refereeUserId },
  });
  if (existing) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Referral already attributed",
    });
  }

  if (program.samePhoneBlock) {
    const referee = await prisma.user.findUnique({
      where: { id: input.refereeUserId },
      select: { phoneNumber: true },
    });
    if (
      referee?.phoneNumber &&
      referralCode.user.phoneNumber &&
      referee.phoneNumber === referralCode.user.phoneNumber
    ) {
      await prisma.promoAbuseEvent.create({
        data: {
          eventType: "SAME_PHONE_REFERRAL",
          userId: input.refereeUserId,
          metadata: { referrerUserId: referralCode.userId },
        },
      });
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Referral not allowed for this account",
      });
    }
  }

  if (program.sameDeviceBlock && input.deviceHash) {
    const deviceReuse = await prisma.referralEdge.findFirst({
      where: {
        deviceHash: input.deviceHash,
        OR: [
          { referrerUserId: referralCode.userId },
          { refereeUserId: referralCode.userId },
        ],
      },
    });
    if (deviceReuse) {
      await prisma.promoAbuseEvent.create({
        data: {
          eventType: "SAME_DEVICE_REFERRAL",
          userId: input.refereeUserId,
          metadata: {
            referrerUserId: referralCode.userId,
            deviceHash: input.deviceHash,
          },
        },
      });
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Referral not allowed for this device",
      });
    }
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const qualifiedToday = await prisma.referralEdge.count({
    where: {
      referrerUserId: referralCode.userId,
      qualifiedAt: { gte: startOfDay },
    },
  });
  if (qualifiedToday >= program.maxQualificationsPerReferrerPerDay) {
    await prisma.promoAbuseEvent.create({
      data: {
        eventType: "VELOCITY_CAP",
        userId: referralCode.userId,
        metadata: { refereeUserId: input.refereeUserId },
      },
    });
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Referral limit reached for today",
    });
  }

  const edge = await prisma.referralEdge.create({
    data: {
      referrerUserId: referralCode.userId,
      refereeUserId: input.refereeUserId,
      referralCodeId: referralCode.id,
      status: "ATTRIBUTED",
      deviceHash: input.deviceHash ?? null,
    },
  });

  let welcomeCouponCode: string | null = null;
  if (program.refereeCouponCampaignId) {
    welcomeCouponCode = await issueRefereeWelcomeCoupon(prisma, {
      campaignId: program.refereeCouponCampaignId,
      refereeUserId: input.refereeUserId,
      edgeId: edge.id,
    });
  }

  const [referrer, referee] = await Promise.all([
    prisma.user.findUnique({
      where: { id: referralCode.userId },
      select: { id: true, email: true, fullName: true },
    }),
    prisma.user.findUnique({
      where: { id: input.refereeUserId },
      select: { fullName: true },
    }),
  ]);
  if (referrer) {
    const { notifyReferralAttributed } = await import("./notify");
    await notifyReferralAttributed({
      referrer: {
        userId: referrer.id,
        email: referrer.email,
        fullName: referrer.fullName,
      },
      refereeName: referee?.fullName,
      edgeId: edge.id,
      prisma,
    });
  }

  return { edgeId: edge.id, welcomeCouponCode };
}

type ProgramRow = {
  referrerCreditAmountXOF: number;
  recurringCreditAmountXOF: number;
  recurringMaxBookings: number;
  recurringWindowDays: number;
  rewardDelayHours: number;
};

/**
 * On paid confirm: qualify edge and enqueue referrer credit (PENDING lot).
 * Cron activates PENDING lots when availableAt <= now.
 */
export async function onBookingConfirmedForReferral(
  prisma: PrismaClient,
  input: {
    userId: string;
    holdGroupId: string;
    /** Cash charged after instruments; used when requirePaidConfirmedBooking. */
    chargeAmountXOF?: number | undefined;
  },
): Promise<void> {
  const program = await prisma.referralProgram.findUnique({
    where: { id: "default" },
  });
  if (!program?.isActive) return;

  if (
    program.requirePaidConfirmedBooking &&
    (input.chargeAmountXOF == null || input.chargeAmountXOF <= 0)
  ) {
    return;
  }

  const edge = await prisma.referralEdge.findUnique({
    where: { refereeUserId: input.userId },
  });
  if (!edge) return;
  if (edge.status === "REJECTED_FRAUD" || edge.status === "EXPIRED") return;

  let kind: "INITIAL" | "RECURRING" = "INITIAL";
  if (edge.status === "ATTRIBUTED") {
    await prisma.referralEdge.update({
      where: { id: edge.id },
      data: {
        status: "QUALIFIED",
        qualifiedAt: new Date(),
        firstHoldGroupId: input.holdGroupId,
      },
    });
    kind = "INITIAL";
  } else if (edge.status === "QUALIFIED" || edge.status === "REWARDED") {
    if (edge.status === "REWARDED" || edge.rewardedAt) {
      kind = "RECURRING";
    } else {
      // Delayed INITIAL may already be PENDING/ACTIVE — never double-enqueue.
      const existingInitial = await prisma.creditLot.findUnique({
        where: { grantIdempotencyKey: `referral:${edge.id}:INITIAL` },
      });
      kind = existingInitial ? "RECURRING" : "INITIAL";
    }
  }

  await enqueueReferrerCredit(prisma, {
    edgeId: edge.id,
    program,
    holdGroupId: input.holdGroupId,
    kind,
  });
}

async function enqueueReferrerCredit(
  prisma: PrismaClient | Prisma.TransactionClient,
  input: {
    edgeId: string;
    program: ProgramRow;
    holdGroupId: string;
    kind: "INITIAL" | "RECURRING";
  },
): Promise<void> {
  const edge = await prisma.referralEdge.findUniqueOrThrow({
    where: { id: input.edgeId },
  });

  const amount =
    input.kind === "INITIAL"
      ? input.program.referrerCreditAmountXOF
      : input.program.recurringCreditAmountXOF;
  if (amount <= 0) return;

  // P0-6: INITIAL is edge-scoped (one per edge). RECURRING stays hold-scoped.
  const idempotencyKey =
    input.kind === "INITIAL"
      ? `referral:${input.edgeId}:INITIAL`
      : `referral:${input.edgeId}:${input.holdGroupId}:RECURRING`;
  const existing = await prisma.creditLot.findUnique({
    where: { grantIdempotencyKey: idempotencyKey },
  });
  if (existing) return;

  if (input.kind === "RECURRING") {
    const prior = await prisma.creditLot.count({
      where: {
        referralEdgeId: edge.id,
        source: "REFERRAL",
        grantIdempotencyKey: { contains: ":RECURRING" },
      },
    });
    if (prior >= input.program.recurringMaxBookings) return;
    if (edge.qualifiedAt) {
      const windowEnd = new Date(edge.qualifiedAt);
      windowEnd.setDate(
        windowEnd.getDate() + input.program.recurringWindowDays,
      );
      if (new Date() > windowEnd) return;
    }
  }

  const delayMs = Math.max(0, input.program.rewardDelayHours) * 60 * 60 * 1000;
  const availableAt = new Date(Date.now() + delayMs);
  const immediate = delayMs === 0;

  await prisma.creditLot.create({
    data: {
      userId: edge.referrerUserId,
      source: "REFERRAL",
      status: immediate ? "ACTIVE" : "PENDING",
      amountXOF: amount,
      remainingXOF: immediate ? amount : 0,
      availableAt: immediate ? null : availableAt,
      referralEdgeId: edge.id,
      sourceHoldGroupId: input.holdGroupId,
      grantIdempotencyKey: idempotencyKey,
    },
  });

  if (immediate && input.kind === "INITIAL" && edge.status !== "REWARDED") {
    await prisma.referralEdge.update({
      where: { id: edge.id },
      data: { status: "REWARDED", rewardedAt: new Date() },
    });
    await postReferralCreditLedger(prisma, {
      userId: edge.referrerUserId,
      amountXOF: amount,
      idempotencyKey: `${idempotencyKey}:ledger`,
      holdGroupId: input.holdGroupId,
    });
    const referrer = await prisma.user.findUnique({
      where: { id: edge.referrerUserId },
      select: { id: true, email: true, fullName: true },
    });
    if (referrer) {
      const lot = await prisma.creditLot.findUnique({
        where: { grantIdempotencyKey: idempotencyKey },
      });
      if (lot) {
        const { notifyReferralRewardPosted } = await import("./notify");
        await notifyReferralRewardPosted({
          referrer: {
            userId: referrer.id,
            email: referrer.email,
            fullName: referrer.fullName,
          },
          amountXOF: amount,
          creditLotId: lot.id,
          prisma,
        });
      }
    }
  }
}

async function postReferralCreditLedger(
  prisma: PrismaClient | Prisma.TransactionClient,
  input: {
    userId: string;
    amountXOF: number;
    idempotencyKey: string;
    holdGroupId: string;
  },
): Promise<void> {
  const { postPromoCreditGrantLedger } = await import(
    "./promo-credit-grant-ledger"
  );
  await postPromoCreditGrantLedger(prisma, {
    userId: input.userId,
    amountXOF: input.amountXOF,
    idempotencyKey: input.idempotencyKey,
    description: "Referral credit grant",
    referenceType: "HOLD_GROUP",
    referenceId: input.holdGroupId,
  });
}

/**
 * Activate due PENDING referral credit lots and post ledger.
 * Idempotent via creditLot status claim + ledger idempotency key.
 */
export async function processDueReferralRewards(
  prisma: PrismaClient,
): Promise<{ activated: number }> {
  const due = await prisma.creditLot.findMany({
    where: {
      status: "PENDING",
      source: "REFERRAL",
      availableAt: { lte: new Date() },
    },
    take: 100,
    orderBy: { availableAt: "asc" },
  });

  let activated = 0;
  for (const lot of due) {
    const claimed = await prisma.creditLot.updateMany({
      where: { id: lot.id, status: "PENDING" },
      data: {
        status: "ACTIVE",
        remainingXOF: lot.amountXOF,
        availableAt: null,
      },
    });
    if (claimed.count !== 1) continue;

    try {
      await postReferralCreditLedger(prisma, {
        userId: lot.userId,
        amountXOF: lot.amountXOF,
        idempotencyKey: `${lot.grantIdempotencyKey ?? lot.id}:ledger`,
        holdGroupId: lot.sourceHoldGroupId ?? lot.id,
      });
    } catch (err: unknown) {
      // P2002 = already posted — treat as success
      const code =
        err && typeof err === "object" && "code" in err
          ? (err as { code?: string }).code
          : undefined;
      if (code !== "P2002") {
        // roll lot back to pending for retry
        await prisma.creditLot.update({
          where: { id: lot.id },
          data: {
            status: "PENDING",
            remainingXOF: 0,
            availableAt: lot.availableAt,
          },
        });
        throw err;
      }
    }

    if (lot.referralEdgeId && lot.grantIdempotencyKey?.endsWith(":INITIAL")) {
      await prisma.referralEdge.updateMany({
        where: {
          id: lot.referralEdgeId,
          status: { in: ["QUALIFIED", "ATTRIBUTED"] },
        },
        data: { status: "REWARDED", rewardedAt: new Date() },
      });
    }

    const referrer = await prisma.user.findUnique({
      where: { id: lot.userId },
      select: { id: true, email: true, fullName: true },
    });
    if (referrer) {
      const { notifyReferralRewardPosted } = await import("./notify");
      await notifyReferralRewardPosted({
        referrer: {
          userId: referrer.id,
          email: referrer.email,
          fullName: referrer.fullName,
        },
        amountXOF: lot.amountXOF,
        creditLotId: lot.id,
        prisma,
      });
    }
    activated++;
  }

  return { activated };
}

export type PublicReferralProgram = {
  isActive: boolean;
  referrerCreditAmountXOF: number;
  recurringCreditAmountXOF: number;
  recurringMaxBookings: number;
  rewardDelayHours: number;
};

export async function getPublicReferralProgram(
  prisma: PrismaClient,
): Promise<PublicReferralProgram> {
  const program = await prisma.referralProgram.findUnique({
    where: { id: "default" },
  });
  return {
    isActive: program?.isActive ?? false,
    referrerCreditAmountXOF: program?.referrerCreditAmountXOF ?? 0,
    recurringCreditAmountXOF: program?.recurringCreditAmountXOF ?? 0,
    recurringMaxBookings: program?.recurringMaxBookings ?? 0,
    rewardDelayHours: program?.rewardDelayHours ?? 48,
  };
}

export async function getReferralStats(prisma: PrismaClient, userId: string) {
  const [{ code }, program, attributed, qualified, rewarded] = await Promise.all([
    ensureReferralCode(prisma, userId),
    getPublicReferralProgram(prisma),
    prisma.referralEdge.count({ where: { referrerUserId: userId } }),
    prisma.referralEdge.count({
      where: {
        referrerUserId: userId,
        status: { in: ["QUALIFIED", "REWARDED"] },
      },
    }),
    prisma.referralEdge.count({
      where: { referrerUserId: userId, status: "REWARDED" },
    }),
  ]);
  return { code, attributed, qualified, rewarded, program };
}

export async function listMyInvitees(
  prisma: PrismaClient,
  userId: string,
  input: { limit: number; offset: number },
) {
  const where = { referrerUserId: userId };
  const [rows, total] = await Promise.all([
    prisma.referralEdge.findMany({
      where,
      orderBy: { attributedAt: "desc" },
      take: input.limit,
      skip: input.offset,
      include: {
        referee: { select: { fullName: true } },
      },
    }),
    prisma.referralEdge.count({ where }),
  ]);

  return {
    total,
    items: rows.map((row) => ({
      id: row.id,
      status: row.status,
      attributedAt: row.attributedAt,
      qualifiedAt: row.qualifiedAt,
      rewardedAt: row.rewardedAt,
      refereeName: displayName(row.referee.fullName, { privacy: true }),
    })),
  };
}
