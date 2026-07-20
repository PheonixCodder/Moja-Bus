/*
  Warnings:

  - You are about to drop the column `paystackSubaccountCode` on the `bank_account` table. All the data in the column will be lost.
  - You are about to drop the column `paystackSubaccountCode` on the `company` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[ownerType,ownerId,accountCategory,accountClass,currency]` on the table `financial_account` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[externalPaymentId,type]` on the table `financial_transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "BlogPostStatus" AS ENUM ('DRAFT', 'REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BlogEventType" AS ENUM ('VIEW', 'READ_25', 'READ_50', 'READ_75', 'READ_100', 'CTA_CLICK', 'SHARE');

-- AlterTable
ALTER TABLE "bank_account" DROP COLUMN "paystackSubaccountCode";

-- AlterTable
ALTER TABLE "bus" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "company" DROP COLUMN "paystackSubaccountCode";

-- AlterTable
ALTER TABLE "operator" ADD COLUMN     "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "platform_settings" ADD COLUMN     "require2FAForWithdrawals" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "rate_limit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "lastRequest" BIGINT NOT NULL,

    CONSTRAINT "rate_limit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_settings_audit" (
    "id" TEXT NOT NULL,
    "settingKey" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB NOT NULL,
    "changedById" TEXT NOT NULL,
    "changeReason" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_settings_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_category" (
    "id" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "blog_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_post" (
    "id" TEXT NOT NULL,
    "status" "BlogPostStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "authorId" TEXT NOT NULL,
    "displayAuthorName" TEXT,
    "displayAuthorBio" TEXT,
    "displayAuthorAvatar" TEXT,
    "coverImage" TEXT,
    "coverImageBlur" TEXT,
    "coverImageAlt" TEXT,
    "coverImageCredit" TEXT,
    "ogImage" TEXT,
    "readingTime" INTEGER NOT NULL DEFAULT 0,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "language" TEXT NOT NULL DEFAULT 'en',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "featuredOrder" INTEGER,
    "allowIndex" BOOLEAN NOT NULL DEFAULT true,
    "allowComments" BOOLEAN NOT NULL DEFAULT false,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "canonicalUrl" TEXT,
    "robots" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "twitterTitle" TEXT,
    "twitterDescription" TEXT,
    "twitterImage" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "lastReviewedAt" TIMESTAMP(3),
    "lastReviewedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_revision" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_revision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_slug_history" (
    "id" TEXT NOT NULL,
    "oldSlug" TEXT NOT NULL,
    "newSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_slug_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_redirect" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "type" INTEGER NOT NULL DEFAULT 301,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_redirect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_event" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "eventType" "BlogEventType" NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BlogPostToBlogTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BlogPostToBlogTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "rate_limit_key_key" ON "rate_limit"("key");

-- CreateIndex
CREATE INDEX "platform_settings_audit_settingKey_idx" ON "platform_settings_audit"("settingKey");

-- CreateIndex
CREATE INDEX "platform_settings_audit_changedById_idx" ON "platform_settings_audit"("changedById");

-- CreateIndex
CREATE UNIQUE INDEX "blog_category_name_key" ON "blog_category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "blog_category_slug_key" ON "blog_category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "blog_tag_name_key" ON "blog_tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "blog_tag_slug_key" ON "blog_tag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "blog_post_slug_key" ON "blog_post"("slug");

-- CreateIndex
CREATE INDEX "blog_post_slug_idx" ON "blog_post"("slug");

-- CreateIndex
CREATE INDEX "blog_post_status_publishedAt_idx" ON "blog_post"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "blog_post_categoryId_idx" ON "blog_post"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "blog_slug_history_oldSlug_key" ON "blog_slug_history"("oldSlug");

-- CreateIndex
CREATE UNIQUE INDEX "blog_redirect_source_key" ON "blog_redirect"("source");

-- CreateIndex
CREATE INDEX "blog_event_postId_eventType_idx" ON "blog_event"("postId", "eventType");

-- CreateIndex
CREATE INDEX "blog_event_createdAt_idx" ON "blog_event"("createdAt");

-- CreateIndex
CREATE INDEX "_BlogPostToBlogTag_B_index" ON "_BlogPostToBlogTag"("B");

-- CreateIndex
CREATE UNIQUE INDEX "financial_account_ownerType_ownerId_accountCategory_account_key" ON "financial_account"("ownerType", "ownerId", "accountCategory", "accountClass", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "financial_transaction_externalPaymentId_type_key" ON "financial_transaction"("externalPaymentId", "type");

-- AddForeignKey
ALTER TABLE "platform_settings_audit" ADD CONSTRAINT "platform_settings_audit_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_category" ADD CONSTRAINT "blog_category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "blog_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post" ADD CONSTRAINT "blog_post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post" ADD CONSTRAINT "blog_post_lastReviewedById_fkey" FOREIGN KEY ("lastReviewedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post" ADD CONSTRAINT "blog_post_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "blog_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_revision" ADD CONSTRAINT "blog_revision_postId_fkey" FOREIGN KEY ("postId") REFERENCES "blog_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_revision" ADD CONSTRAINT "blog_revision_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_event" ADD CONSTRAINT "blog_event_postId_fkey" FOREIGN KEY ("postId") REFERENCES "blog_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogPostToBlogTag" ADD CONSTRAINT "_BlogPostToBlogTag_A_fkey" FOREIGN KEY ("A") REFERENCES "blog_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogPostToBlogTag" ADD CONSTRAINT "_BlogPostToBlogTag_B_fkey" FOREIGN KEY ("B") REFERENCES "blog_tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
