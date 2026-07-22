import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";


const OTP_SUBJECTS: Record<string, string> = {
  "sign-in": "Your Moja Ride verification code",
  "email-verification": "Verify your Moja Ride account",
  "change-email": "Verify your new email address",
  "transfer-ownership": "Verify ownership transfer code",
  "withdrawal-2fa": "Verify your withdrawal confirmation code",
};

const OTP_INTROS: Record<string, string> = {
  "sign-in": "Use the verification code below to sign in to your Moja Ride account:",
  "email-verification": "Welcome to Moja Ride! Use the verification code below to verify your email and activate your account:",
  "change-email": "Use the verification code below to confirm your new email address:",
  "transfer-ownership": "Use the verification code below to confirm and authorize the business ownership transfer:",
  "withdrawal-2fa": "Use the verification code below to confirm and authorize your withdrawal request:",
};

export const authOtpWorkflow = workflow(
  "auth-otp",
  async ({ step, payload }) => {
    await step.email(
      "send-email",
      async () => {
        const subject = OTP_SUBJECTS[payload.type] || "Your Moja Ride verification code";
        const intro = OTP_INTROS[payload.type] || "Use the verification code below:";

        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
            <h2 style="color: #0081F1; margin-top: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">Moja Ride</h2>
            <p style="font-size: 16px; line-height: 1.5; color: #334155;">${intro}</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center; background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 24px 0; color: #0f172a; font-family: monospace;">
              ${escapeHtml(payload.otpCode)}
            </div>
            <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 0;">This code is valid for 10 minutes. If you did not request this code, you can safely ignore this email.</p>
          </div>
        `;

        return {
          subject,
          body: html,
        };
      },
      {
        skip: () => !payload.email,
      }
    );

    await step.sms(
      "send-sms",
      async () => ({
        body: `Moja Ride: Use code ${escapeHtml(payload.otpCode)} to complete your verification. Valid for 10 minutes.`,
      }),
      {
        skip: () => !payload.phone,
      }
    );
  },
  {
    name: "Unified Auth OTP",
    description: "Multi-channel verification OTP flow for passengers and general auth operations",
    preferences: {
      all: { readOnly: true },
    },
    payloadSchema: z.object({
      email: z.string().email().optional(),
      otpCode: z.string().length(6),
      type: z.string(),
      phone: z.string().optional(),
    }),
  }
);