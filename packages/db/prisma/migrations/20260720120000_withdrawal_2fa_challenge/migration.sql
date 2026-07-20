-- Withdrawal 2FA challenge store (F-18).
-- Self-contained one-time code gate for operator withdrawals, isolated from
-- Better Auth. New table only — safe to apply on existing databases.

-- CreateTable
CREATE TABLE "withdrawal_2fa_challenge" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "withdrawal_2fa_challenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "withdrawal_2fa_challenge_companyId_idx" ON "withdrawal_2fa_challenge"("companyId");

-- CreateIndex
CREATE INDEX "withdrawal_2fa_challenge_userId_idx" ON "withdrawal_2fa_challenge"("userId");

-- AddForeignKey
ALTER TABLE "withdrawal_2fa_challenge" ADD CONSTRAINT "withdrawal_2fa_challenge_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
