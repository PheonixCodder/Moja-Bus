export type AuthOtpType = "sign-in" | "email-verification" | "forget-password";

export interface AuthOtpPayload {
  email: string;
  otp: string;
  type: AuthOtpType;
}

export function sendAuthOtp({ email, otp, type }: AuthOtpPayload): void {
  console.log(`[auth] ${type} OTP for ${email}: ${otp}`);
}
