"use client";

import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  BusFront,
  CheckCircle2,
  Loader2,
  Mail,
  RefreshCw,
  Shield,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { AdminRoleBadge } from "@/features/admin/components/staff/role-badge";
import {
  ADMIN_ROLE_LABELS,
  type AdminStaffRole,
} from "@/features/admin/lib/admin-staff";
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/trpc/client";

type Step = "welcome" | "create-account" | "sign-in" | "otp" | "done";

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

export function AdminInvitationView() {
  const t = useTranslations("adminInvite");
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

  const {
    data: invitation,
    isLoading,
    error,
  } = useQuery({
    ...trpc.adminStaff.validateToken.queryOptions({ token }),
    enabled: !!token,
    retry: false,
  });

  const acceptMutation = useMutation({
    ...trpc.adminStaff.accept.mutationOptions(),
  });

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

  async function sendOtp(email: string): Promise<boolean> {
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "sign-in",
    });
    if (error) {
      toast.error(error.message ?? t("toastSendFailed"));
      return false;
    }
    startResendCooldown();
    return true;
  }

  async function handleSendOtpNewUser() {
    if (!fullName.trim()) {
      toast.error(t("toastNameRequired"));
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
    toast.success(t("toastCodeResent"));
    setSubmitting(false);
  }

  async function handleVerifyOtp() {
    if (otpCode.length < 6) {
      toast.error(t("toastEnterCode"));
      return;
    }
    if (!invitation) return;

    setSubmitting(true);
    try {
      const { error } = await authClient.signIn.emailOtp({
        email: invitation.email,
        otp: otpCode,
        ...(isNewUser && fullName ? { name: fullName } : {}),
      });

      if (error) {
        let msg = error.message ?? t("toastInvalidCode");
        if (error.code === "TOO_MANY_ATTEMPTS") {
          msg = t("toastTooManyAttempts");
        } else if (error.code === "INVALID_OTP") {
          msg = t("toastInvalidOtp");
        } else if (error.code === "OTP_EXPIRED") {
          msg = t("toastOtpExpired");
        }
        toast.error(msg);
        setSubmitting(false);
        return;
      }

      await acceptMutation.mutateAsync({ token });
      setStep("done");
      setTimeout(() => router.push("/dashboard/admin"), 2500);
    } catch (err) {
      toast.error(
        (err instanceof Error ? err.message : undefined) ??
          t("toastAcceptFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const roleLabel =
    ADMIN_ROLE_LABELS[invitation?.role as AdminStaffRole] ?? invitation?.role;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <BrandHeader />

      <div className="w-full max-w-md">
        {/* ── NO TOKEN ── */}
        {!token && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <h1 className="text-[18px] font-semibold text-foreground mb-2">
              {t("invalidLink")}
            </h1>
            <p className="text-[13px] text-muted-foreground mb-6">
              {t("invalidLinkDesc")}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="text-[13px]"
              onClick={() => router.push("/")}
            >
              {t("goHome")}
            </Button>
          </div>
        )}

        {/* ── LOADING ── */}
        {!!token && isLoading && (
          <div className="flex flex-col items-center gap-4 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#ee237c]" />
            <p className="text-[14px] text-muted-foreground">
              {t("validating")}
            </p>
          </div>
        )}

        {/* ── ERROR / INVALID ── */}
        {!!token && !isLoading && error && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <h1 className="text-[18px] font-semibold text-foreground mb-2">
              {t("invitationInvalid")}
            </h1>
            <p className="text-[13px] text-muted-foreground mb-6">
              {error.message ?? t("invitationInvalidFallback")}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="text-[13px]"
              onClick={() => router.push("/")}
            >
              {t("goHome")}
            </Button>
          </div>
        )}

        {/* ── WELCOME ── */}
        {!!token && !isLoading && invitation && step === "welcome" && (
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent border border-border">
                <Shield className="h-6 w-6 text-foreground/70" />
              </div>
              <div>
                <h1 className="text-[17px] font-bold text-foreground">
                  {t("adminTeam")}
                </h1>
                <p className="text-[12px] text-muted-foreground">
                  {t("adminInvitation")}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-accent/30 p-4 mb-6 space-y-2">
              <p className="text-[13px] text-muted-foreground">
                {t.rich("invitedYou", {
                  name: invitation.invitedBy?.fullName ?? "A team member",
                  strong: (chunks) => (
                    <strong className="text-foreground">{chunks}</strong>
                  ),
                })}
              </p>
              <div className="flex items-center gap-2">
                <AdminRoleBadge role={invitation.role} />
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
                {t("createAccountJoin")}
              </Button>
              <Button
                variant="outline"
                className="h-10 text-[13px] border-border"
                onClick={() => setStep("sign-in")}
              >
                {t("signInInstead")}
              </Button>
            </div>
          </div>
        )}

        {/* ── CREATE ACCOUNT ── */}
        {!!token && !isLoading && invitation && step === "create-account" && (
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <h1 className="text-[17px] font-bold text-foreground mb-1">
              {t("createYourAccount")}
            </h1>
            <p className="text-[13px] text-muted-foreground mb-6">
              {t.rich("joinAs", {
                role: roleLabel,
                strong: (chunks) => (
                  <strong className="text-foreground">{chunks}</strong>
                ),
              })}
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium">{t("email")}</Label>
                <Input
                  type="email"
                  value={invitation.email}
                  readOnly
                  className="h-9 text-[13px] bg-accent/30 text-muted-foreground cursor-not-allowed border-border"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fullname" className="text-[12px] font-medium">
                  {t("fullName")}
                </Label>
                <Input
                  id="fullname"
                  placeholder={t("namePlaceholder")}
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
                    {t("sendCode")} <ArrowRight className="ml-1.5 h-4 w-4" />
                  </>
                )}
              </Button>

              <button
                type="button"
                className="w-full text-center text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setStep("welcome")}
              >
                {t("back")}
              </button>
            </div>
          </div>
        )}

        {/* ── SIGN IN ── */}
        {!!token && !isLoading && invitation && step === "sign-in" && (
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <h1 className="text-[17px] font-bold text-foreground mb-1">
              {t("signInTitle")}
            </h1>
            <p className="text-[13px] text-muted-foreground mb-6">
              {t.rich("signInDesc", {
                role: roleLabel,
                strong: (chunks) => (
                  <strong className="text-foreground">{chunks}</strong>
                ),
              })}
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium">{t("email")}</Label>
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
                    {t("sendCode")} <ArrowRight className="ml-1.5 h-4 w-4" />
                  </>
                )}
              </Button>

              <button
                type="button"
                className="w-full text-center text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setStep("welcome")}
              >
                {t("back")}
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
              {t("checkInbox")}
            </h1>
            <p className="text-[13px] text-muted-foreground mb-6">
              {t.rich("checkInboxDesc", {
                email: invitation.email,
                strong: (chunks) => (
                  <strong className="text-foreground">{chunks}</strong>
                ),
              })}
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="otp-code" className="text-[12px] font-medium">
                  {t("verificationCode")}
                </Label>
                <Input
                  id="otp-code"
                  placeholder={t("codePlaceholder")}
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otpCode}
                  onChange={(e) =>
                    setOtpCode(e.target.value.replace(/\D/g, ""))
                  }
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
                    {t("verifyAndAccept")}{" "}
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || submitting}
                >
                  <RefreshCw className="h-3 w-3" />
                  {resendCooldown > 0
                    ? t("resendIn", { count: resendCooldown })
                    : t("resendCode")}
                </button>
              </div>

              <button
                type="button"
                className="w-full text-center text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => {
                  setOtpCode("");
                  setStep(isNewUser ? "create-account" : "sign-in");
                }}
              >
                {t("back")}
              </button>
            </div>
          </div>
        )}

        {/* ── DONE ── */}
        {!!token && !isLoading && invitation && step === "done" && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-[20px] font-bold text-foreground mb-2">
              {t("welcomeTo")}
            </h1>
            <p className="text-[13px] text-muted-foreground">
              {t.rich("acceptedAs", {
                role: roleLabel,
                strong: (chunks) => (
                  <strong className="text-foreground">{chunks}</strong>
                ),
              })}
            </p>
            <div className="mt-6 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-[#ee237c]" />
            </div>
          </div>
        )}
      </div>

      <p className="mt-8 text-[12px] text-muted-foreground">
        {t("footer", { year: new Date().getFullYear() })}
      </p>
    </div>
  );
}
