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

export function sendAuthOtp({ email, otp, type }: AuthOtpPayload): void {
  // TODO: Replace with actual email provider implementation
  console.log(`[auth] ${type} OTP for ${email}: ${otp}`);
}
