"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@moja/ui/components/ui/button";
import { Checkbox } from "@moja/ui/components/ui/checkbox";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { PhoneInput } from "@moja/ui/components/ui/phone-input";
import { AuthCard } from "./auth-card";
import { SocialLogin } from "./social-login";
import { useAuth } from "@/features/auth/hooks/use-auth";

export function OperatorSignupForm() {
  const { isPending, signUp } = useAuth();

  const [fullName, setFullName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const passwordsMatch = password === confirmPassword;
  const passwordLongEnough = password.length >= 8;

  const canSubmit =
      fullName.trim().length > 0 &&
      workEmail.trim().length > 0 &&
      phone.trim().length > 0 &&
      password.length > 0 &&
      confirmPassword.length > 0 &&
      passwordsMatch &&
      passwordLongEnough &&
      acceptTerms;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!acceptTerms) {
      toast.error("Please accept the terms and conditions to continue.");
      return;
    }

    if (!passwordsMatch) {
      toast.error("Passwords do not match.");
      return;
    }

    if (!passwordLongEnough) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    // Company details (name, registration number, locations, documents, bank)
    // are collected in the onboarding flow after email verification.
    // We only register the user account here.
    await signUp(fullName.trim(), workEmail.trim(), password, phone, "OPERATOR", workEmail.trim());
  }

  return (
      <AuthCard
          title="Register your transport business"
          description="Create your account first. You'll complete your company profile in the next step."
          footer={
            <>
              Already have a business account?{" "}
              <Link href="/operator/login" className="ml-1 font-medium text-primary">
                Sign in
              </Link>
            </>
          }
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="fullName">Your full name</Label>
            <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your legal name"
                autoComplete="name"
                required
                disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="workEmail">Work email</Label>
            <Input
                id="workEmail"
                type="email"
                value={workEmail}
                onChange={(e) => setWorkEmail(e.target.value)}
                placeholder="your.name@company.com"
                autoComplete="email"
                required
                disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Use your business email — this will be your login.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Phone number</Label>
            <PhoneInput
                id="phone"
                value={phone}
                onChange={(value) => setPhone(value ?? "")}
                placeholder="+225 07 00 00 00 00"
                autoComplete="tel"
                defaultCountry="CI"
                international
                required
                disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                autoComplete="new-password"
                required
                disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              At least 8 characters.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                autoComplete="new-password"
                required
                disabled={isPending}
            />
            {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-xs text-destructive">Passwords do not match.</p>
            )}
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                disabled={isPending}
            />
            <Label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
              I accept the{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Terms and Conditions
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </Label>
          </div>

          <Button
              type="submit"
              className="w-full"
              disabled={isPending || !canSubmit}
          >
            {isPending ? "Creating account…" : "Create business account"}
          </Button>
        </form>

        <SocialLogin />
      </AuthCard>
  );
}