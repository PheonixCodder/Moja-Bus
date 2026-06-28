"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@moja/ui/components/ui/input-otp";
import { AuthCard } from "./auth-card";
import { useAuth } from "@/features/auth/hooks/use-auth";

type ResetPasswordFormProps = {
  email: string;
};

export function ResetPasswordForm({ email }: ResetPasswordFormProps) {
  const { isPending, resetPassword } = useAuth();
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (otp.length !== 6) {
      toast.error("Enter the 6-digit code.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    await resetPassword(email, otp, password);
  }

  return (
    <AuthCard
      title="Set a new password"
      description="Enter the code from your email and choose a new password."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label>Verification code</Label>
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
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your new password"
            autoComplete="new-password"
            required
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="confirm-password">Confirm new password</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your new password"
            autoComplete="new-password"
            required
            disabled={isPending}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isPending || otp.length !== 6}
        >
          {isPending ? "Updating..." : "Update password"}
        </Button>
      </form>
    </AuthCard>
  );
}
