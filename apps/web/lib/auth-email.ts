import { getPrismaClient } from "@moja/db";
import { getNovuClient } from "@/lib/novu";

export type AuthOtpType =
  | "sign-in"
  | "email-verification"
  | "forget-password"
  | "change-email"
  | string; // Adding string for flexibility with phoneNumber plugin

export interface AuthOtpPayload {
  identifier: string; // Email or Phone number
  otp: string;
  type: AuthOtpType;
}

export async function sendAuthOtp({
  identifier,
  otp,
  type,
}: AuthOtpPayload): Promise<void> {
  console.log(`\n=== 🔐 OTP verification for ${identifier}: ${otp} ===\n`);

  const novu = getNovuClient();

  if (!novu) {
    console.warn("[NOVU] NOVU_SECRET_KEY not configured — OTP not sent.");
    return;
  }

  try {
    const isEmail = identifier.includes("@");

    // Check if it's an operator signup
    if (isEmail && type === "sign-in") {
      const prisma = getPrismaClient();
      const pending = await prisma.pendingOperatorSignup.findUnique({
        where: { email: identifier },
      });

      if (pending) {
        // Trigger branded operator-signup-otp
        await novu.trigger({
          workflowId: "operator-signup-otp",
          to: {
            subscriberId: identifier,
            email: identifier,
          },
          payload: {
            email: identifier,
            otpCode: otp,
            companyName: pending.companyName,
            ownerName: pending.ownerName,
          },
          transactionId: `operator-signup-otp-${identifier}-${Date.now()}`,
        });
        console.log(`[NOVU] Successfully triggered operator-signup-otp for ${identifier}`);
        return;
      }
    }

    await novu.trigger({
      workflowId: "auth-otp",
      to: {
        subscriberId: identifier,
        email: isEmail ? identifier : undefined,
        phone: !isEmail ? identifier : undefined,
      },
      payload: {
        identifier,
        otpCode: otp,
        type,
        ...(isEmail ? { email: identifier } : { phone: identifier }),
      },
      transactionId: `auth-otp-${identifier}-${type}-${Date.now()}`,
    });

    console.log(`[NOVU] Successfully triggered auth-otp for ${identifier}`);
  } catch (err) {
    console.error("[NOVU] Failed to trigger auth-otp workflow:", err);
  }
}
