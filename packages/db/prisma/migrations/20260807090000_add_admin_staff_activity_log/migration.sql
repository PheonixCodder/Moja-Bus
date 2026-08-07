-- CreateTable
CREATE TABLE "admin_staff_activity_log" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "targetUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_staff_activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_staff_activity_log_userId_idx" ON "admin_staff_activity_log"("userId");

-- CreateIndex
CREATE INDEX "admin_staff_activity_log_action_idx" ON "admin_staff_activity_log"("action");

-- CreateIndex
CREATE INDEX "admin_staff_activity_log_targetUserId_idx" ON "admin_staff_activity_log"("targetUserId");

-- AddForeignKey
ALTER TABLE "admin_staff_activity_log" ADD CONSTRAINT "admin_staff_activity_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
