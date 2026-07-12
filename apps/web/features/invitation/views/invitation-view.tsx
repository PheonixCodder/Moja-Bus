"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BusFront,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Building2,
  Mail,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";

import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { InviteRoleBadge } from "../components/invite-role-badge";
import { ROLE_LABELS } from "@/features/operator/lib/staff";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Step = "welcome" | "create-account" | "sign-in" | "otp" | "done";

// ─────────────────────────────────────────────────────────────────────────────
// Branding header
// ─────────────────────────────────────────────────────────────────────────────

function BrandHeader() {
  return (
    <div className="mb-8 flex items-center gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ee237c]/10">
        <BusFront className="h-5 w-5 text-[#ee237c]" />
      </div>
      <span className="text-[18px] font-bold tracking-tight text-foreground">
        Moja<span className="text-[#ee237c]">Ride</span>
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// View
// ─────────────────────────────────────────────────────────────────────────────

export function InvitationView() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";

  const [step, setStep] = useState<Step>("welcome");
  const [fullName, setFullName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const trpc = useTRPC();

  // ── tRPC: validate the token ────────────────────────────────────────────────
  const {
    data: invitation,
    isLoading,
    error,
  } = useQuery({
    ...trpc.invitation.validateToken.queryOptions({ token }),
    enabled: !!token,
    retry: false,
  });

  // ── tRPC: accept mutation ────────────────────────────────────────────────────
  const acceptMutation = useMutation({
    ...trpc.invitation.accept.mutationOptions(),
  });

  // ── Cooldown timer for resend ─────────────────────────────────────────────
  function startResendCooldown() {
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // ── Send OTP helper ───────────────────────────────────────────────────────
  async function sendOtp(email: string): Promise<boolean> {
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "sign-in",
    });
    if (error) {
      toast.error(error.message ?? "Failed to send verification code.");
      return false;
    }
    startResendCooldown();
    return true;
  }

  // ── Handlers ─────────────────────────────────────────────────────────────

  async function handleSendOtpNewUser() {
    if (!fullName.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!invitation) return;
    setSubmitting(true);
    const ok = await sendOtp(invitation.email);
    if (ok) {
      setIsNewUser(true);
      setStep("otp");
    }
    setSubmitting(false);
  }

  async function handleSendOtpExistingUser() {
    if (!invitation) return;
    setSubmitting(true);
    const ok = await sendOtp(invitation.email);
    if (ok) {
      setIsNewUser(false);
      setStep("otp");
    }
    setSubmitting(false);
  }

  async function handleResendOtp() {
    if (!invitation || resendCooldown > 0) return;
    setSubmitting(true);
    await sendOtp(invitation.email);
    toast.success("Code resent!");
    setSubmitting(false);
  }

  async function handleVerifyOtp() {
    if (otpCode.length < 6) {
      toast.error("Please enter the full 6-digit code");
      return;
    }
    if (!invitation) return;

    setSubmitting(true);
    try {
      // converged flow — creates user if new, signs in if existing
      const { error } = await authClient.signIn.emailOtp({
        email: invitation.email,
        otp: otpCode,
        ...(isNewUser && fullName ? { name: fullName } : {}),
      });

      if (error) {
        let msg = error.message ?? "Invalid verification code.";
        if (error.code === "TOO_MANY_ATTEMPTS") {
          msg = "Too many attempts. Please request a new code later.";
        } else if (error.code === "INVALID_OTP") {
          msg = "Invalid verification code. Please check and try again.";
        } else if (error.code === "OTP_EXPIRED") {
          msg = "Verification code has expired. Please request a new code.";
        }
        toast.error(msg);
        setSubmitting(false);
        return;
      }

      // Session is established — now accept the invitation
      await acceptMutation.mutateAsync({ token });

      setStep("done");
      setTimeout(() => router.push("/dashboard/operator"), 2500);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to accept invitation");
    } finally {
      setSubmitting(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <BrandHeader />

      <div className="w-full max-w-md">
        {/* ── NO TOKEN ── */}
        {!token && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <h1 className="text-[18px] font-semibold text-foreground mb-2">
              Invalid Link
            </h1>
            <p className="text-[13px] text-muted-foreground mb-6">
              No invitation token found in the URL. Please check your email link.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="text-[13px]"
              onClick={() => router.push("/")}
            >
              Go to Homepage
            </Button>
          </div>
        )}

        {/* ── LOADING ── */}
        {!!token && isLoading && (
          <div className="flex flex-col items-center gap-4 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#ee237c]" />
            <p className="text-[14px] text-muted-foreground">
              Validating your invitation…
            </p>
          </div>
        )}

        {/* ── ERROR / INVALID ── */}
        {!!token && !isLoading && error && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <h1 className="text-[18px] font-semibold text-foreground mb-2">
              Invitation Invalid
            </h1>
            <p className="text-[13px] text-muted-foreground mb-6">
              {error.message ?? "This invitation is invalid or has expired."}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="text-[13px]"
              onClick={() => router.push("/")}
            >
              Go to Homepage
            </Button>
          </div>
        )}

        {/* ── WELCOME ── */}
        {!!token && !isLoading && invitation && step === "welcome" && (
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent border border-border">
                <Building2 className="h-6 w-6 text-foreground/70" />
              </div>
              <div>
                <h1 className="text-[17px] font-bold text-foreground">
                  {invitation.company.name}
                </h1>
                <p className="text-[12px] text-muted-foreground">
                  Company invitation
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-accent/30 p-4 mb-6 space-y-2">
              <p className="text-[13px] text-muted-foreground">
                <strong className="text-foreground">
                  {invitation.invitedBy.fullName}
                </strong>{" "}
                has invited you to join{" "}
                <strong className="text-foreground">
                  {invitation.company.name}
                </strong>{" "}
                as:
              </p>
              <div className="flex items-center gap-2">
                <InviteRoleBadge role={invitation.role} />
                {invitation.jobTitle && (
                  <span className="text-[12px] text-muted-foreground">
                    · {invitation.jobTitle}
                  </span>
                )}
              </div>
              {invitation.message && (
                <p className="text-[13px] text-muted-foreground italic border-l-2 border-[#ee237c]/40 pl-3 mt-2">
                  "{invitation.message}"
                </p>
              )}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                className="h-10 text-[13px] bg-[#ee237c] hover:bg-[#d11f6e] text-white"
                onClick={() => setStep("create-account")}
              >
                Create Account & Join
              </Button>
              <Button
                variant="outline"
                className="h-10 text-[13px] border-border"
                onClick={() => setStep("sign-in")}
              >
                Sign In Instead
              </Button>
            </div>
          </div>
        )}

        {/* ── CREATE ACCOUNT ── */}
        {!!token && !isLoading && invitation && step === "create-account" && (
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <h1 className="text-[17px] font-bold text-foreground mb-1">
              Create your account
            </h1>
            <p className="text-[13px] text-muted-foreground mb-6">
              Join <strong>{invitation.company.name}</strong> as{" "}
              <strong>{ROLE_LABELS[invitation.role]}</strong>. We'll send a
              verification code to confirm your identity.
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium">Email</Label>
                <Input
                  type="email"
                  value={invitation.email}
                  readOnly
                  className="h-9 text-[13px] bg-accent/30 text-muted-foreground cursor-not-allowed border-border"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fullname" className="text-[12px] font-medium">
                  Full Name *
                </Label>
                <Input
                  id="fullname"
                  placeholder="Your full name"
                  className="h-9 text-[13px] border-border"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtpNewUser()}
                  disabled={submitting}
                />
              </div>

              <Button
                className="w-full h-10 text-[13px] bg-[#ee237c] hover:bg-[#d11f6e] text-white mt-2"
                onClick={handleSendOtpNewUser}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Send Verification Code <ArrowRight className="ml-1.5 h-4 w-4" />
                  </>
                )}
              </Button>

              <button
                className="w-full text-center text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setStep("welcome")}
              >
                ← Back
              </button>
            </div>
          </div>
        )}

        {/* ── SIGN IN ── */}
        {!!token && !isLoading && invitation && step === "sign-in" && (
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <h1 className="text-[17px] font-bold text-foreground mb-1">
              Sign in to your account
            </h1>
            <p className="text-[13px] text-muted-foreground mb-6">
              We'll send a one-time code to your email to verify your identity
              before joining <strong>{invitation.company.name}</strong>.
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium">Email</Label>
                <Input
                  type="email"
                  value={invitation.email}
                  readOnly
                  className="h-9 text-[13px] bg-accent/30 text-muted-foreground cursor-not-allowed border-border"
                />
              </div>

              <Button
                className="w-full h-10 text-[13px] bg-[#ee237c] hover:bg-[#d11f6e] text-white mt-2"
                onClick={handleSendOtpExistingUser}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Send Verification Code <ArrowRight className="ml-1.5 h-4 w-4" />
                  </>
                )}
              </Button>

              <button
                className="w-full text-center text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setStep("welcome")}
              >
                ← Back
              </button>
            </div>
          </div>
        )}

        {/* ── OTP ── */}
        {!!token && !isLoading && invitation && step === "otp" && (
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ee237c]/10 mb-5">
              <Mail className="h-5 w-5 text-[#ee237c]" />
            </div>
            <h1 className="text-[17px] font-bold text-foreground mb-1">
              Check your inbox
            </h1>
            <p className="text-[13px] text-muted-foreground mb-6">
              We sent a 6-digit code to{" "}
              <strong className="text-foreground">{invitation.email}</strong>.
              Enter it below to continue.
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="otp-code" className="text-[12px] font-medium">
                  Verification Code
                </Label>
                <Input
                  id="otp-code"
                  placeholder="000000"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                  className="h-11 text-[16px] tracking-[0.3em] text-center border-border font-mono"
                  disabled={submitting}
                />
              </div>

              <Button
                className="w-full h-10 text-[13px] bg-[#ee237c] hover:bg-[#d11f6e] text-white"
                onClick={handleVerifyOtp}
                disabled={submitting || otpCode.length < 6}
              >
                {submitting || acceptMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Verify &amp; Join {invitation.company.name}{" "}
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-1.5">
                <button
                  className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || submitting}
                >
                  <RefreshCw className="h-3 w-3" />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                </button>
              </div>

              <button
                className="w-full text-center text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => {
                  setOtpCode("");
                  setStep(isNewUser ? "create-account" : "sign-in");
                }}
              >
                ← Back
              </button>
            </div>
          </div>
        )}

        {/* ── DONE ── */}
        {!!token && !isLoading && invitation && step === "done" && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-[20px] font-bold text-foreground mb-2">
              Welcome to {invitation.company.name}!
            </h1>
            <p className="text-[13px] text-muted-foreground">
              You have joined as <strong>{ROLE_LABELS[invitation.role]}</strong>
              . Redirecting to your dashboard…
            </p>
            <div className="mt-6 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-[#ee237c]" />
            </div>
          </div>
        )}
      </div>

      <p className="mt-8 text-[12px] text-muted-foreground">
        © {new Date().getFullYear()} Moja Ride. All rights reserved.
      </p>
    </div>
  );
}
