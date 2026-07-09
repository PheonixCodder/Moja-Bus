import { sendEmail } from "./email-client";

export type AuthOtpType =
  | "sign-in"
  | "email-verification"
  | "forget-password"
  | "change-email";

export interface AuthOtpPayload {
  email: string;
  otp: string;
  type: AuthOtpType;
}

const OTP_SUBJECTS: Record<AuthOtpType, string> = {
  "sign-in": "Your Moja Ride sign-in code",
  "email-verification": "Verify your Moja Ride email",
  "forget-password": "Reset your Moja Ride password",
  "change-email": "Confirm your Moja Ride email change",
};

const OTP_INTROS: Record<AuthOtpType, string> = {
  "sign-in": "Use this code to sign in to your Moja Ride account.",
  "email-verification": "Use this code to verify your email address.",
  "forget-password": "Use this code to reset your password.",
  "change-email": "Use this code to confirm your new email address.",
};

export async function sendAuthOtp({
  email,
  otp,
  type,
}: AuthOtpPayload): Promise<void> {
  console.log(otp);
  const subject = OTP_SUBJECTS[type];
  const intro = OTP_INTROS[type];

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #ee237c;">Moja Ride</h2>
      <p>${intro}</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #111;">${otp}</p>
      <p style="color: #666; font-size: 14px;">This code expires soon. If you did not request it, you can ignore this email.</p>
    </div>
  `;

  const text = `${intro}\n\nYour code: ${otp}\n\nIf you did not request this, ignore this email.`;

  try {
    await sendEmail({ to: email, subject, html, text });
  } catch (error) {
    console.error(`[MOCK EMAIL SENT] ${email}: ${otp}`);
    // Ignore error so background task doesn't crash if Resend is not configured
  }
}
