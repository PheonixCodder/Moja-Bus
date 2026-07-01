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

type SignupFormProps = {
  role?: "TRAVELER" | "OPERATOR" | "ADMIN";
  userType?: "passenger" | "operator";
};

export function SignupForm({
  role = "TRAVELER",
  userType = "passenger",
}: SignupFormProps) {
  const { isPending, signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const isPassenger = userType === "passenger";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!acceptTerms) {
      toast.error("Please accept the terms and conditions");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    await signUp(fullName, email, password, phone, role);
  }

  return (
    <AuthCard
      title={
        isPassenger
          ? "Create your passenger account"
          : "Create your operator account"
      }
      description={
        isPassenger
          ? "Join Moja Ride and start booking your trips today."
          : "Register as a transport operator to manage your business."
      }
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={isPassenger ? "/login" : "/operator/login"}
            className="ml-1 font-medium text-primary"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
            autoComplete="name"
            required
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            autoComplete="email"
            required
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Phone number</Label>
          <PhoneInput
            id="phone"
            value={phone}
            onChange={(value) => setPhone(value ?? "")}
            placeholder="+225 XX XX XX XX"
            autoComplete="tel"
            country="CI"
            defaultCountry="CI"
            international={false}
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
            Must be at least 8 characters long
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
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id="terms"
            checked={acceptTerms}
            onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
            disabled={isPending}
          />
          <Label
            htmlFor="terms"
            className="text-xs text-muted-foreground cursor-pointer"
          >
            I accept the{" "}
            {
              <Link href="/terms" className="text-primary hover:underline">
                Terms and Conditions
              </Link>
            }{" "}
            and{" "}
            {
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            }
          </Label>
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Creating account..." : "Create account"}
        </Button>
      </form>
      <SocialLogin />
    </AuthCard>
  );
}
