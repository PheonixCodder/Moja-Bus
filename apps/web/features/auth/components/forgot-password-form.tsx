"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { AuthCard } from "./auth-card";
import { useAuth } from "@/features/auth/hooks/use-auth";

type ForgotPasswordFormProps = {
  userType?: "passenger" | "operator";
};

export function ForgotPasswordForm({
  userType = "passenger",
}: ForgotPasswordFormProps) {
  const { isPending, forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const router = useRouter();

  const isPassenger = userType === "passenger";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await forgotPassword(email);
    if (result.success) {
      const resetPath =
        userType === "operator"
          ? "/operator/reset-password"
          : "/reset-password";
      router.push(`${resetPath}?email=${encodeURIComponent(email)}`);
    }
  }

  return (
    <AuthCard
      title="Reset your password"
      description={
        isPassenger
          ? "Enter your email and we will send a reset code."
          : "Enter your work email and we will send a reset code."
      }

    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">
            {isPassenger ? "Email address" : "Work email address"}
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={
              isPassenger ? "you@example.com" : "your.work@email.com"
            }
            autoComplete="email"
            required
            disabled={isPending}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Sending..." : "Send reset link"}
        </Button>
      </form>
    </AuthCard>
  );
}
