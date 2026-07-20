-- Add objectKey column to CompanyDocument.
-- New private (compliance) documents are served via signed GET using this key;
-- legacy public documents keep using `fileUrl`.
ALTER TABLE "CompanyDocument" ADD COLUMN "objectKey" TEXT;
