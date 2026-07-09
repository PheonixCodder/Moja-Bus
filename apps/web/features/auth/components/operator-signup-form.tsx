"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@moja/ui/components/ui/button";
import { Checkbox } from "@moja/ui/components/ui/checkbox";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { PhoneInput } from "@moja/ui/components/ui/phone-input";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { AuthCard } from "./auth-card";
import { authClient } from "@/lib/auth-client";

type Step = "details" | "otp" | "password";

export function OperatorSignupForm() {
  const router = useRouter();
  const trpc = useTRPC();

  const [step, setStep] = useState<Step>("details");
  const [isPending, setIsPending] = useState(false);

  // Form State
  const [companyName, setCompanyName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("CI");
  
  const [otp, setOtp] = useState("");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  // TRPC Mutations
  const initSignup = useMutation(trpc.operator.initSignup.mutationOptions());
  const verifyOtp = useMutation(trpc.operator.verifySignupOtp.mutationOptions());
  const completeSignup = useMutation(trpc.operator.completeSignup.mutationOptions());

  const passwordsMatch = password === confirmPassword;
  const passwordLongEnough = password.length >= 8;

  async function handleDetailsSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!companyName || !ownerName || !email || !phone || !country) return;

    setIsPending(true);
    try {
      await initSignup.mutateAsync({
        companyName,
        ownerName,
        email,
        phone,
        country,
      });
      setStep("otp");
      toast.success("Verification code sent to your email!");
    } catch (err: any) {
      toast.error(err.message || "Failed to initialize signup.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleOtpSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (otp.length !== 6) {
      toast.error("OTP must be 6 digits.");
      return;
    }

    setIsPending(true);
    try {
      await verifyOtp.mutateAsync({ email, otp });
      setStep("password");
      toast.success("Email verified!");
    } catch (err: any) {
      toast.error(err.message || "Invalid OTP.");
    } finally {
      setIsPending(false);
    }
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
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

    setIsPending(true);
    try {
      // 1. Create User in Better Auth
      const { error, data } = await authClient.signUp.email({
        name: ownerName,
        email,
        password,
        phone,
        role: "OPERATOR",
        workEmail: email,
      } as any);

      if (error) {
        toast.error(error.message || "Failed to create user account.");
        setIsPending(false);
        return;
      }

      // 2. Complete signup via TRPC (marks email as verified)
      await completeSignup.mutateAsync({ email });

      // 3. Authenticate to establish session
      const signInRes = await authClient.signIn.email({
        email,
        password,
      });
      
      if (signInRes.error) {
        toast.error("Account created! Please log in.");
        router.push("/operator/login");
        return;
      }

      toast.success(`Welcome to ${process.env["NEXT_PUBLIC_APP_NAME"] || "Moja Ride"}!`);
      router.push("/dashboard/operator/onboarding");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
      setIsPending(false);
    }
  }

  if (step === "password") {
    return (
      <AuthCard
        title="Create your password"
        description="Secure your business account."
      >
        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              required
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
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
            <Label
              htmlFor="terms"
              className="text-xs text-muted-foreground cursor-pointer leading-relaxed"
            >
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

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating account…" : "Create business account"}
          </Button>
        </form>
      </AuthCard>
    );
  }

  if (step === "otp") {
    return (
      <AuthCard
        title="Verify your email"
        description={`We sent a 6-digit code to ${email}`}
      >
        <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="otp">Verification Code</Label>
            <Input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              maxLength={6}
              required
              disabled={isPending}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Verifying…" : "Verify code"}
          </Button>
        </form>
      </AuthCard>
    );
  }

  // step === "details"
  return (
    <AuthCard
      title="Register your transport business"
      description="Tell us about your company to get started."
      footer={
        <>
          Already have a business account?{" "}
          <Link href="/operator/login" className="ml-1 font-medium text-primary">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleDetailsSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="companyName">Company name</Label>
          <Input
            id="companyName"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Express Transit"
            required
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="ownerName">Your full name</Label>
          <Input
            id="ownerName"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="Your legal name"
            required
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.name@company.com"
            required
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Phone number</Label>
          <PhoneInput
            id="phone"
            value={phone}
            onChange={(value: string | undefined) => setPhone(value ?? "")}
            placeholder="+225 07 00 00 00 00"
            country="CI"
            defaultCountry="CI"
            international={false}
            required
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="CI"
            required
            disabled={isPending}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Sending code…" : "Continue"}
        </Button>
      </form>
    </AuthCard>
  );
}
