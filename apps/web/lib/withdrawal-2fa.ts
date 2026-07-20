import crypto from "crypto";
import { getOptionalEnv } from "@moja/config";
import type { PrismaClient } from "@moja/db";
import { sendAuthOtp } from "./auth-email";

/**
 * Self-contained 2FA gate for operator withdrawals (F-18).
 *
 * This deliberately does NOT reuse Better Auth's `emailOTP` plugin: its OTP
 * `type` enum is hardcoded to four auth-only values and cannot be extended, so
 * a withdrawal-confirmation code would have to co-opt an auth type. Instead we
 * keep our own single-use challenge store (`withdrawal_2fa_challenge`) and reuse
 * only the existing OTP *delivery* channel (`sendAuthOtp` → Novu auth-otp in
 * prod, console log in dev). Codes are stored hashed (never plaintext) and are
 * verified with a constant-time compare, then atomically consumed (one use).
 */

const WITHDRAWAL_2FA_TTL_SECONDS = 600; // 10 minutes
const WITHDRAWAL_2FA_MAX_ATTEMPTS = 5;

function getPepper(): string {
  // Mixed into the code hash so the stored value is not the raw code even if
  // the table is read. Falls back to the auth secret, then a dev constant.
  return (
    getOptionalEnv("WITHDRAWAL_2FA_PEPPER", process.env) ??
    getOptionalEnv("BETTER_AUTH_SECRET", process.env) ??
    "dev-withdrawal-2fa-pepper"
  );
}

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(`${code}:${getPepper()}`).digest("hex");
}

function generateCode(): string {
  // 6-digit numeric OTP.
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export type CreateWithdrawalChallengeResult = { code: string };

/**
 * Issue a fresh withdrawal 2FA challenge for a company and deliver the code to
 * the requester's email. Any previously open challenge for the company is
 * invalidated first, so only the latest code is usable (prevents replay across
 * re-issues).
 */
export async function createWithdrawalChallenge(params: {
  prisma: PrismaClient;
  companyId: string;
  userId: string;
  email: string;
}): Promise<CreateWithdrawalChallengeResult> {
  const { prisma, companyId, userId, email } = params;
  const code = generateCode();
  const expiresAt = new Date(Date.now() + WITHDRAWAL_2FA_TTL_SECONDS * 1000);

  // Invalidate earlier open challenges for this company.
  await prisma.withdrawalTwoFactorChallenge.updateMany({
    where: { companyId, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  await prisma.withdrawalTwoFactorChallenge.create({
    data: {
      companyId,
      userId,
      email,
      codeHash: hashCode(code),
      expiresAt,
    },
  });

  // Delivery reuses the existing auth OTP channel. `type` is passthrough, so no
  // auth-server / Novu changes are required.
  await sendAuthOtp({ identifier: email, otp: code, type: "withdrawal-2fa" });

  return { code };
}

export type VerifyWithdrawalChallengeResult = {
  ok: boolean;
  reason?:
    | "not_found"
    | "expired"
    | "invalid"
    | "too_many_attempts";
};

/**
 * Verify (and consume) the latest open withdrawal 2FA challenge for a company.
 * Single-use: a successful verify sets `consumedAt` atomically so the same code
 * can never authorize two withdrawals. Wrong codes increment an attempt budget
 * and lock the challenge once exhausted.
 */
export async function verifyWithdrawalChallenge(params: {
  prisma: PrismaClient;
  companyId: string;
  code: string;
}): Promise<VerifyWithdrawalChallengeResult> {
  const { prisma, companyId, code } = params;

  const challenge = await prisma.withdrawalTwoFactorChallenge.findFirst({
    where: { companyId, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!challenge) {
    return { ok: false, reason: "not_found" };
  }

  if (challenge.expiresAt.getTime() < Date.now()) {
    await prisma.withdrawalTwoFactorChallenge.updateMany({
      where: { id: challenge.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    return { ok: false, reason: "expired" };
  }

  if (challenge.attempts >= WITHDRAWAL_2FA_MAX_ATTEMPTS) {
    await prisma.withdrawalTwoFactorChallenge.updateMany({
      where: { id: challenge.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    return { ok: false, reason: "too_many_attempts" };
  }

  const expected = Buffer.from(hashCode(code));
  const actual = Buffer.from(challenge.codeHash);
  const match =
    expected.length === actual.length &&
    crypto.timingSafeEqual(expected, actual);

  if (!match) {
    const nextAttempts = challenge.attempts + 1;
    if (nextAttempts >= WITHDRAWAL_2FA_MAX_ATTEMPTS) {
      await prisma.withdrawalTwoFactorChallenge.updateMany({
        where: { id: challenge.id, consumedAt: null },
        data: { consumedAt: new Date() },
      });
    } else {
      await prisma.withdrawalTwoFactorChallenge.update({
        where: { id: challenge.id },
        data: { attempts: nextAttempts },
      });
    }
    return { ok: false, reason: "invalid" };
  }

  // Atomic single-use consume — only the first concurrent caller wins.
  const consumed = await prisma.withdrawalTwoFactorChallenge.updateMany({
    where: { id: challenge.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  if (consumed.count === 0) {
    return { ok: false, reason: "not_found" };
  }

  return { ok: true };
}
