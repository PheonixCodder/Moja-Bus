import { workflow } from "@novu/framework";
import { z } from "zod";

export const operatorSignupOtpWorkflow = workflow(
  "operator-signup-otp",
  async ({ step, payload }) => {
    await step.email("send-email", async () => {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #ee237c; margin-top: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">Moja Ride Business</h2>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">Hello ${payload.ownerName},</p>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">Verify your email address to complete registration for <strong>${payload.companyName}</strong>:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center; background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 24px 0; color: #0f172a; font-family: monospace;">
            ${payload.otpCode}
          </div>
          <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 0;">This code is valid for 15 minutes. If you did not initiate this registration, please ignore this email.</p>
        </div>
      `;

      return {
        subject: `${payload.otpCode} is your Moja Ride business verification code`,
        body: html,
      };
    });
  },
  {
    name: "Operator Signup Verification OTP",
    description: "Sends email verification code to operator during registration Phase 1",
    preferences: {
      all: { readOnly: true },
    },
    payloadSchema: z.object({
      email: z.string().email(),
      otpCode: z.string().length(6),
      companyName: z.string(),
      ownerName: z.string(),
    }),
  }
);
