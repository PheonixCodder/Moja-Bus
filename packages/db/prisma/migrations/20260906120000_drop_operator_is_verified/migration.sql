-- Drop unused Operator.isVerified.
-- The column defaulted to false and was never set true by any product path.
-- Staff "Verified" badges now read User.emailVerified (invite accept already sets it).
-- KEEP BankAccount.isVerified and DriverCompanyAffiliation.isVerified — different models.

ALTER TABLE "operator" DROP COLUMN IF EXISTS "isVerified";
