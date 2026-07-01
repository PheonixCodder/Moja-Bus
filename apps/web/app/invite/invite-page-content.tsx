"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BusFront, CheckCircle2, AlertCircle, Loader2, ArrowRight, Building2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@moja/ui/lib/utils";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";

import {
  validateInvitationToken,
  acceptInvitation,
  ROLE_LABELS,
  type InvitationValidation,
  type StaffRole,
} from "@/features/operator/api/staff";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Step = "loading" | "invalid" | "welcome" | "sign-in" | "create-account" | "joining" | "done";

// ─────────────────────────────────────────────────────────────────────────────
// ROLE BADGE
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<StaffRole, string> = {
  OWNER: "bg-amber-500/15 text-amber-700 border-amber-300",
  ADMIN: "bg-purple-500/15 text-purple-700 border-purple-300",
  MANAGER: "bg-blue-500/15 text-blue-700 border-blue-300",
  OPERATIONS: "bg-sky-500/15 text-sky-700 border-sky-300",
  FINANCE: "bg-emerald-500/15 text-emerald-700 border-emerald-300",
  SUPPORT: "bg-slate-500/15 text-slate-700 border-slate-300",
};

function InviteRoleBadge({ role }: { role: StaffRole }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-3 py-0.5 text-[12px] font-semibold", ROLE_COLORS[role])}>
      {ROLE_LABELS[role]}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN INVITE PAGE CONTENT (client component)
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";

export function InvitePageContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";

  const [step, setStep] = useState<Step>("loading");
  const [invitation, setInvitation] = useState<InvitationValidation | null>(null);
  const [error, setError] = useState<string>("");

  // Form state
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ── Validate token on mount ──────────────────────────────────────────────

  useEffect(() => {
    if (!token) {
      setError("No invitation token found in the URL. Please check your email link.");
      setStep("invalid");
      return;
    }

    validateInvitationToken(token)
      .then((data) => {
        setInvitation(data);
        setStep("welcome");
      })
      .catch((err) => {
        setError(err?.message ?? "This invitation is invalid or has expired.");
        setStep("invalid");
      });
  }, [token]);

  // ── Accept invitation (after sign-in or sign-up) ─────────────────────────

  async function handleAccept() {
    setSubmitting(true);
    try {
      await acceptInvitation(token);
      setStep("done");
      setTimeout(() => router.push("/dashboard/operator"), 2500);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to accept invitation");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Create account + accept ──────────────────────────────────────────────

  async function handleCreateAccount() {
    if (!fullName.trim()) { toast.error("Full name is required"); return; }
    if (!password || password.length < 8) { toast.error("Password must be at least 8 characters"); return; }

    setSubmitting(true);
    try {
      // Register via Better Auth
      const signUpRes = await fetch(`${API_BASE}/api/auth/sign-up/email`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          email: invitation!.email,
          password,
        }),
      });

      if (!signUpRes.ok) {
        const body = await signUpRes.json().catch(() => ({}));
        throw new Error(body.message ?? "Failed to create account");
      }

      // Now accept the invitation (session cookie is set by sign-up)
      await acceptInvitation(token);
      setStep("done");
      setTimeout(() => router.push("/dashboard/operator"), 2500);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create account");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Sign in + accept ─────────────────────────────────────────────────────

  async function handleSignIn() {
    if (!password) { toast.error("Password is required"); return; }

    setSubmitting(true);
    try {
      const signInRes = await fetch(`${API_BASE}/api/auth/sign-in/email`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: invitation!.email, password }),
      });

      if (!signInRes.ok) {
        const body = await signInRes.json().catch(() => ({}));
        throw new Error(body.message ?? "Sign in failed. Please check your password.");
      }

      await acceptInvitation(token);
      setStep("done");
      setTimeout(() => router.push("/dashboard/operator"), 2500);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to sign in");
    } finally {
      setSubmitting(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      {/* Branding */}
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ee237c]/10">
          <BusFront className="h-5 w-5 text-[#ee237c]" />
        </div>
        <span className="text-[18px] font-bold tracking-tight text-foreground">
          Moja<span className="text-[#ee237c]">Ride</span>
        </span>
      </div>

      <div className="w-full max-w-md">
        {/* ── LOADING ── */}
        {step === "loading" && (
          <div className="flex flex-col items-center gap-4 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#ee237c]" />
            <p className="text-[14px] text-muted-foreground">Validating your invitation…</p>
          </div>
        )}

        {/* ── INVALID ── */}
        {step === "invalid" && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <h1 className="text-[18px] font-semibold text-foreground mb-2">Invitation Invalid</h1>
            <p className="text-[13px] text-muted-foreground mb-6">{error}</p>
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
        {step === "welcome" && invitation && (
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent border border-border">
                <Building2 className="h-6 w-6 text-foreground/70" />
              </div>
              <div>
                <h1 className="text-[17px] font-bold text-foreground">{invitation.company.name}</h1>
                <p className="text-[12px] text-muted-foreground">Company invitation</p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-accent/30 p-4 mb-6 space-y-2">
              <p className="text-[13px] text-muted-foreground">
                <strong className="text-foreground">{invitation.invitedBy}</strong> has invited you to join{" "}
                <strong className="text-foreground">{invitation.company.name}</strong> as:
              </p>
              <div className="flex items-center gap-2">
                <InviteRoleBadge role={invitation.role} />
                {invitation.jobTitle && (
                  <span className="text-[12px] text-muted-foreground">· {invitation.jobTitle}</span>
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
        {step === "create-account" && invitation && (
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <h1 className="text-[17px] font-bold text-foreground mb-1">Create your account</h1>
            <p className="text-[13px] text-muted-foreground mb-6">
              Join <strong>{invitation.company.name}</strong> as{" "}
              <strong>{ROLE_LABELS[invitation.role]}</strong>.
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
                <Label htmlFor="fullname" className="text-[12px] font-medium">Full Name *</Label>
                <Input
                  id="fullname"
                  placeholder="Your full name"
                  className="h-9 text-[13px] border-border"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password-new" className="text-[12px] font-medium">Password *</Label>
                <Input
                  id="password-new"
                  type="password"
                  placeholder="At least 8 characters"
                  className="h-9 text-[13px] border-border"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button
                className="w-full h-10 text-[13px] bg-[#ee237c] hover:bg-[#d11f6e] text-white mt-2"
                onClick={handleCreateAccount}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>Join {invitation.company.name} <ArrowRight className="ml-1.5 h-4 w-4" /></>
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
        {step === "sign-in" && invitation && (
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <h1 className="text-[17px] font-bold text-foreground mb-1">Sign in to your account</h1>
            <p className="text-[13px] text-muted-foreground mb-6">
              Use your existing account to join <strong>{invitation.company.name}</strong>.
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
                <Label htmlFor="password-existing" className="text-[12px] font-medium">Password *</Label>
                <Input
                  id="password-existing"
                  type="password"
                  placeholder="Your password"
                  className="h-9 text-[13px] border-border"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                />
              </div>

              <Button
                className="w-full h-10 text-[13px] bg-[#ee237c] hover:bg-[#d11f6e] text-white mt-2"
                onClick={handleSignIn}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>Sign In & Join <ArrowRight className="ml-1.5 h-4 w-4" /></>
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

        {/* ── DONE ── */}
        {step === "done" && invitation && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-[20px] font-bold text-foreground mb-2">
              Welcome to {invitation.company.name}!
            </h1>
            <p className="text-[13px] text-muted-foreground">
              You've joined as <strong>{ROLE_LABELS[invitation.role]}</strong>. Redirecting to your dashboard…
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
