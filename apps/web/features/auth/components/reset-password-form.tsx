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
  userType?: "passenger" | "operator";
};

export function ResetPasswordForm({
  email,
  userType = "passenger",
}: ResetPasswordFormProps) {
  const { isPending, resetPassword } = useAuth();
  const isPassenger = userType === "passenger";
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
      title={isPassenger ? "Set a new password" : "Set a new business password"}
      description={
        isPassenger
          ? "Enter the code from your email and choose a new password."
          : "Enter the code from your work email and set a new password."
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label>
            {isPassenger ? "Verification code" : "Work email verification code"}
          </Label>
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
          <Label htmlFor="password">
            {isPassenger ? "New password" : "New business password"}
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={
              isPassenger
                ? "Enter your new password"
                : "Enter your new business password"
            }
            autoComplete="new-password"
            required
            disabled={isPending}
          />
          <p className="text-xs text-muted-foreground">
            Must be at least 8 characters long
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="confirm-password">
            {isPassenger
              ? "Confirm new password"
              : "Confirm new business password"}
          </Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={
              isPassenger
                ? "Confirm your new password"
                : "Confirm your new business password"
            }
            autoComplete="new-password"
            required
            disabled={isPending}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={
            isPending ||
            otp.length !== 6 ||
            password !== confirmPassword ||
            password.length < 8
          }
        >
          {isPending
            ? "Updating..."
            : isPassenger
              ? "Update password"
              : "Update business password"}
        </Button>
      </form>
    </AuthCard>
  );
}
