import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";


const OTP_SUBJECTS = {
  "sign-in": "Your Moja Ride sign-in code",
  "email-verification": "Verify your Moja Ride email",
  "change-email": "Confirm your Moja Ride email change",
  "transfer-ownership": "Confirm business ownership transfer",
} as const;

const OTP_INTROS = {
  "sign-in": "Use this code to sign in to your Moja Ride account.",
  "email-verification": "Use this code to verify your email address and activate your account.",
  "change-email": "Use this code to confirm your new email address.",
  "transfer-ownership": "Use this code to confirm the transfer of your business ownership. This action is irreversible.",
} as const;

export const authOtpWorkflow = workflow(
  "auth-otp",
  async ({ step, payload }) => {
    // 1. Send Email (SendGrid) if email is provided
    if (payload.email) {
      await step.email("send-email", async () => {
        const subject = OTP_SUBJECTS[payload.type];
        const intro = OTP_INTROS[payload.type];

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
      });
    }

    // 2. Conditionally send SMS (Twilio) if phone is provided
    if (payload.phone) {
      await step.sms("send-sms", async () => ({
        body: `Moja Ride: Use code ${escapeHtml(payload.otpCode)} to complete your verification. Valid for 10 minutes.`,
      }));
    }
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
      type: z.enum(["sign-in", "email-verification", "change-email", "transfer-ownership"]),
      phone: z.string().optional(),
    }),
  }
);
