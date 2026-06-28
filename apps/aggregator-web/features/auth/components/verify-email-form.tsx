"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@moja/ui/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@moja/ui/components/ui/input-otp";
import { AuthCard } from "./auth-card";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { authClient } from "@/lib/auth-client";

type VerifyEmailFormProps = {
  email?: string | undefined;
};

export function VerifyEmailForm({ email }: VerifyEmailFormProps) {
  const { isPending, verifyEmail } = useAuth();
  const [otp, setOtp] = useState("");
  const [isResending, setIsResending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (otp.length !== 6) {
      toast.error("Enter the 6-digit verification code.");
      return;
    }

    await verifyEmail(email as string, otp);
  }

  async function handleResend() {
    if (!email) {
      toast.error("No email address found. Please sign up again.");
      return;
    }

    setIsResending(true);
    try {
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });
      toast.success("A new verification code was sent.");
    } catch {
      toast.error("Failed to resend verification email. Please try again.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <AuthCard
      title="Verify your email"
      description={
        email
          ? `Enter the 6-digit code we sent to ${email}.`
          : "Enter the 6-digit code we sent to your inbox."
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={setOtp}
            disabled={isPending}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isPending || otp.length !== 6}
        >
          {isPending ? "Verifying..." : "Verify email"}
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="w-full"
          disabled={isResending}
          onClick={handleResend}
        >
          {isResending ? "Sending..." : "Resend code"}
        </Button>
      </form>
    </AuthCard>
  );
}
