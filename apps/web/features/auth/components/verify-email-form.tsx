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
  userType?: "passenger" | "operator";
};

export function VerifyEmailForm({
  email,
  userType = "passenger",
}: VerifyEmailFormProps) {
  const { isPending, verifyEmail } = useAuth();
  const [otp, setOtp] = useState("");
  const [isResending, setIsResending] = useState(false);

  const isPassenger = userType === "passenger";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email) {
      toast.error(
        "Your email address is missing. Please go back and sign up again.",
      );
      return;
    }

    if (otp.length !== 6) {
      toast.error("Enter the 6-digit verification code.");
      return;
    }

    // verifyEmail now reads the live session post-verification to decide
    // where to redirect — no role guessing from the URL.
    await verifyEmail(email, otp);
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
      toast.success("A new verification code has been sent.");
    } catch {
      toast.error("Failed to resend the verification email. Please try again.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <AuthCard
      title={isPassenger ? "Verify your email" : "Verify your work email"}
      description={
        email
          ? `Enter the 6-digit code we sent to ${email}.`
          : isPassenger
            ? "Enter the 6-digit code we sent to your inbox."
            : "Enter the 6-digit code we sent to your work email."
      }
    >
      {!email && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          No email address found. Please{" "}
          <a
            href={isPassenger ? "/signup" : "/operator/signup"}
            className="font-medium underline"
          >
            go back and sign up again
          </a>
          .
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={setOtp}
            disabled={isPending || !email}
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
          disabled={isPending || otp.length !== 6 || !email}
        >
          {isPending
            ? "Verifying…"
            : isPassenger
              ? "Verify email"
              : "Verify work email"}
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="w-full"
          disabled={isResending || !email}
          onClick={handleResend}
        >
          {isResending ? "Sending…" : "Resend code"}
        </Button>
      </form>
    </AuthCard>
  );
}
