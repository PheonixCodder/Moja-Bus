"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { authClient } from "@/lib/auth-client";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Spinner } from "@moja/ui/components/ui/spinner";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@moja/ui/components/ui/field";
import { Switch } from "@moja/ui/components/ui/switch";
import { Checkbox } from "@moja/ui/components/ui/checkbox";
import { PhoneInput } from "@moja/ui/components/ui/phone-input";
import { toE164 } from "@/lib/phone/phone-number";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";

type AuthStep = "input" | "otp" | "profile" | "details";

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 50 : -50,
    opacity: 0,
  }),
};

export function PassengerAuthFlow({
  userType = "passenger",
  initialStep = "input",
  initialUser,
  callbackUrl,
  detectedCountry,
}: {
  userType?: "passenger" | "operator" | undefined;
  initialStep?: AuthStep | undefined;
  initialUser?: { email?: string; phone?: string } | undefined;
  callbackUrl?: string | undefined;
  detectedCountry?: string | undefined;
}) {
  const t = useTranslations("auth");
  const {
    isPending: authPending,
    sendPassengerOtp,
    verifyPassengerOtp,
  } = useAuth();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();

  function resolvePostAuthPath(fallback = "/dashboard") {
    if (userType !== "passenger") return fallback;
    if (!callbackUrl) return fallback;
    // Inline safe check to avoid circular import issues in client bundle
    const trimmed = callbackUrl.trim();
    if (
      !trimmed.startsWith("/") ||
      trimmed.startsWith("//") ||
      trimmed.includes("://")
    ) {
      return fallback;
    }
    return trimmed;
  }

  const [step, setStep] = useState<AuthStep>(initialStep);
  const [direction, setDirection] = useState(1);
  const [identifier, setIdentifier] = useState(
    initialUser ? initialUser.email || initialUser.phone || "" : "",
  );
  const [method, setMethod] = useState<"phone" | "email">(
    initialUser && initialUser.phone ? "phone" : "email",
  );
  const [otp, setOtp] = useState("");
  const [identifierError, setIdentifierError] = useState("");
  const [sentIdentifier, setSentIdentifier] = useState("");

  // Passenger Profile setup states (for new travelers)
  const [fullName, setFullName] = useState("");
  const [preferredSeat, setPreferredSeat] = useState<
    "WINDOW" | "AISLE" | "NONE"
  >("NONE");
  const [preferredClass, setPreferredClass] = useState<
    "ECONOMY" | "STANDARD" | "VIP"
  >("ECONOMY");
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  // Operator Company details states (for new operators)
  const [companyName, setCompanyName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [operatorCollectedEmail, setOperatorCollectedEmail] = useState("");
  const [operatorCollectedPhone, setOperatorCollectedPhone] = useState("");
  const [localPending, setLocalPending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);

  // TRPC Mutations
  const updatePreferencesMutation = useMutation(
    trpc.passenger.updatePreferences.mutationOptions({
      onSuccess: () => {
        toast.success(t("passenger.toastProfileComplete"));
        router.push(resolvePostAuthPath("/dashboard"));
        router.refresh();
      },
      onError: (err) => {
        toast.error(err.message || t("passenger.toastProfileFailed"));
        setLocalPending(false);
      },
    }),
  );

  const checkAccountStatusMutation = useMutation(
    trpc.operator.checkAccountStatus.mutationOptions(),
  );

  const initSignupMutation = useMutation(
    trpc.operator.initSignup.mutationOptions(),
  );

  const detectMethod = (input: string): "phone" | "email" => {
    const cleanInput = input.trim();
    if (cleanInput.includes("@")) {
      return "email";
    }
    // Anything composed of digits/space/+/-/() (national, +225, or fully
    // international) is treated as a phone; anything else is an email-like
    // identifier that fails downstream validation.
    return /^[0-9\s+\-()]+$/.test(cleanInput) ? "phone" : "email";
  };

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    const detectedMethod = detectMethod(identifier);
    setMethod(detectedMethod);

    if (userType === "operator") {
      let finalIdentifier = identifier.trim();
      if (detectedMethod === "phone" && !finalIdentifier.startsWith("+")) {
        if (finalIdentifier.length === 10) {
          finalIdentifier = `+225${finalIdentifier}`;
        }
      }
      try {
        const res = await checkAccountStatusMutation.mutateAsync({
          identifier: finalIdentifier,
        });

        if (res.exists) {
          // Only real ERP staff may sign in through the operator form.
          if (res.role !== "OPERATOR" && res.role !== "ADMIN") {
            toast.error(t("operator.toastPassengerIdentifier"));
            return;
          }
          // Operator exists -> send sign-in OTP directly
          if (detectedMethod === "phone") {
            const { error } = await authClient.phoneNumber.sendOtp({
              phoneNumber: finalIdentifier,
            });
            if (error) throw new Error(error.message);
          } else {
            const { error } = await authClient.emailOtp.sendVerificationOtp({
              email: finalIdentifier,
              type: "sign-in",
            });
            if (error) throw new Error(error.message);
          }

          setDirection(1);
          setStep("otp");
          toast.success(t("operator.toastCodeSent"));
        } else {
          // New Operator -> transition to details form
          setDirection(1);
          setStep("details");
        }
      } catch (err: any) {
        toast.error(err.message || t("operator.toastCheckFailed"));
      }
    } else {
      // Passenger flow
      let finalIdentifier: string;
      if (detectedMethod === "phone") {
        // Normalize national/international input to E.164 using the detected
        // country as the default. Strict validation is enforced by the
        // libphonenumber rules — invalid numbers are rejected up front.
        const e164 = toE164(identifier, detectedCountry);
        if (!e164) {
          setIdentifierError(t("passenger.invalidPhone"));
          return;
        }
        finalIdentifier = e164;
      } else {
        const email = identifier.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          setIdentifierError(t("passenger.invalidEmail"));
          return;
        }
        finalIdentifier = email;
      }

      setIdentifierError("");
      setSentIdentifier(finalIdentifier);
      const { success } = await sendPassengerOtp(
        finalIdentifier,
        detectedMethod,
      );
      if (success) {
        setDirection(1);
        setStep("otp");
      }
    }
  }

  async function handleOperatorDetailsSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim() || !ownerName.trim()) return;

    const emailVal =
      method === "email" ? identifier.trim() : operatorCollectedEmail.trim();
    const phoneVal =
      method === "phone" ? identifier.trim() : operatorCollectedPhone.trim();

    if (!emailVal) {
      toast.error(t("operator.toastEmailRequired"));
      return;
    }
    if (!phoneVal) {
      toast.error(t("operator.toastPhoneRequired"));
      return;
    }
    if (!acceptTerms) {
      toast.error(t("operator.toastTermsRequired"));
      return;
    }

    try {
      // 1. Initialize company and owner details in database
      await initSignupMutation.mutateAsync({
        companyName: companyName.trim(),
        ownerName: ownerName.trim(),
        email: emailVal,
        phone: phoneVal,
        country: "CI",
      });

      // 2. Trigger Better Auth OTP (based on signup method)
      if (method === "phone") {
        const { error } = await authClient.phoneNumber.sendOtp({
          phoneNumber: identifier.trim(),
        });
        if (error) throw new Error(error.message);
      } else {
        const { error } = await authClient.emailOtp.sendVerificationOtp({
          email: identifier.trim(),
          type: "sign-in",
        });
        if (error) throw new Error(error.message);
      }

      setDirection(1);
      setStep("otp");
      toast.success(t("operator.toastCodeSent"));
    } catch (err: any) {
      toast.error(err.message || t("operator.toastInitFailed"));
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    let finalIdentifier = identifier.trim();
    if (
      method === "phone" &&
      !finalIdentifier.startsWith("+") &&
      finalIdentifier.length === 10
    ) {
      finalIdentifier = `+225${finalIdentifier}`;
    }

    if (userType === "operator") {
      setOtpVerifying(true);
      try {
        let res: any;
        if (method === "phone") {
          res = await authClient.phoneNumber.verify({
            phoneNumber: finalIdentifier,
            code: otp,
          });
        } else {
          res = await authClient.signIn.emailOtp({
            email: finalIdentifier,
            otp,
          });
        }
        if (res.error) throw res.error;

        toast.success(
          t("operator.toastWelcome", {
            appName: process.env["NEXT_PUBLIC_APP_NAME"] || "Moja Ride",
          }),
        );

        // Route by onboarding status, not by account age — a COMPLETED operator
        // goes to the dashboard, everyone else continues onboarding.
        try {
          const statusData = await queryClient.fetchQuery(
            trpc.operator.getOnboardingStatus.queryOptions(),
          );
          router.push(
            statusData?.onboardingStatus === "COMPLETED"
              ? "/dashboard/operator"
              : "/dashboard/operator/onboarding",
          );
        } catch {
          router.push("/dashboard/operator/onboarding");
        }
        router.refresh();
      } catch (err: any) {
        let msg = t("operator.toastInvalidCode");
        if (err && typeof err === "object") {
          const code = err.code;
          if (code === "TOO_MANY_ATTEMPTS") {
            msg = t("operator.toastTooMany");
          } else if (code === "INVALID_OTP") {
            msg = t("operator.toastInvalidOtp");
          } else if (code === "OTP_EXPIRED") {
            msg = t("operator.toastOtpExpired");
          } else if (err.message) {
            msg = err.message;
          }
        }
        toast.error(msg);
      } finally {
        setOtpVerifying(false);
      }
    } else {
      // Passenger verify — must use the exact identifier (E.164 for phones)
      // that the OTP was issued to, not the raw text the user typed.
      const verifyIdentifier =
        method === "phone" && sentIdentifier
          ? sentIdentifier
          : identifier.trim();
      const res = await verifyPassengerOtp(verifyIdentifier, otp, method);
      if (res.success) {
        if (res.isNewUser) {
          setDirection(1);
          setStep("profile");
        } else {
          router.push(resolvePostAuthPath("/dashboard"));
          router.refresh();
        }
      }
    }
  }

  async function handleCompleteProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 2) {
      toast.error(t("passenger.toastInvalidName"));
      return;
    }

    setLocalPending(true);
    try {
      const { error } = await authClient.updateUser({
        name: fullName.trim(),
      });
      if (error) throw error;

      updatePreferencesMutation.mutate({
        fullName: fullName.trim(),
        preferredSeat,
        preferredClass,
        marketingOptIn,
      });
    } catch (err: any) {
      toast.error(err.message || t("passenger.toastUpdateFailed"));
      setLocalPending(false);
    }
  }

  const isPending =
    authPending ||
    localPending ||
    otpVerifying ||
    updatePreferencesMutation.isPending ||
    checkAccountStatusMutation.isPending ||
    initSignupMutation.isPending;

  // Operator details step: the Continue button stays disabled until Company
  // Name, Full Name, and the collected Phone/Email (field depends on the
  // identifier method from step 1) are all provided, plus terms accepted.
  // This guarantees initSignup always receives a real email + phone, so no
  // placeholder/guest email can ever be derived from a phone-only entry.
  const detailsValid =
    Boolean(companyName.trim()) &&
    Boolean(ownerName.trim()) &&
    (method === "email"
      ? Boolean(operatorCollectedPhone.trim())
      : Boolean(operatorCollectedEmail.trim())) &&
    acceptTerms;

  return (
    <div className="w-full overflow-hidden max-w-[500px] mx-auto px-4 sm:px-6">
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full bg-transparent border-none shadow-none"
      >
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="w-full py-2 flex flex-col gap-4"
          >
            {/* Header section based on step */}
            <div className="space-y-3 text-center mb-4">
              <h1 className="font-medium text-4xl tracking-tight text-text-primary">
                {step === "input" &&
                  (userType === "passenger"
                    ? t("passenger.inputHeading")
                    : t("operator.inputHeading"))}
                {step === "details" && t("operator.detailsHeading")}
                {step === "otp" &&
                  (userType === "passenger"
                    ? t("passenger.otpHeading")
                    : t("operator.otpHeading"))}
                {step === "profile" && t("passenger.profileHeading")}
              </h1>
              <p className="text-muted-foreground text-base">
                {step === "input" &&
                  (userType === "passenger"
                    ? t("passenger.inputDescription")
                    : t("operator.inputDescription"))}
                {step === "details" && t("operator.detailsDescription")}
                {step === "otp" &&
                  t(
                    userType === "passenger"
                      ? "passenger.otpDescription"
                      : "operator.otpDescription",
                    { identifier },
                  )}
                {step === "profile" && t("passenger.profileDescription")}
              </p>
            </div>

            {/* Input Step Form */}
            {step === "input" && (
              <form onSubmit={handleSendCode} className="flex flex-col gap-4">
                <FieldGroup className="gap-4">
                  <Field className="gap-1.5">
                    <FieldLabel htmlFor="identifier">
                      {userType === "passenger"
                        ? t("passenger.inputLabel")
                        : t("operator.inputLabel")}
                    </FieldLabel>
                    <Input
                      id="identifier"
                      type="text"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        if (identifierError) setIdentifierError("");
                      }}
                      placeholder={
                        userType === "passenger"
                          ? t("passenger.inputPlaceholder")
                          : t("operator.inputPlaceholder")
                      }
                      required
                      disabled={isPending}
                      autoFocus
                      className="h-11 px-4 w-full box-border"
                      style={{ boxSizing: "border-box" }}
                    />
                    {identifierError ? (
                      <FieldError>{identifierError}</FieldError>
                    ) : null}
                  </Field>
                </FieldGroup>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isPending || !identifier.trim()}
                >
                  {isPending
                    ? t(`${userType}.inputChecking`)
                    : t(`${userType}.inputContinue`)}
                </Button>
              </form>
            )}

            {/* Company Details Step Form (Operators Only) */}
            {step === "details" && (
              <form
                onSubmit={handleOperatorDetailsSubmit}
                className="flex flex-col gap-4"
              >
                <FieldGroup className="gap-4">
                  <Field className="gap-1.5">
                    <FieldLabel htmlFor="companyName">
                      {t("operator.detailsCompanyLabel")}
                    </FieldLabel>
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder={t("operator.detailsCompanyPlaceholder")}
                      required
                      disabled={isPending}
                      autoFocus
                      className="h-11 px-4 w-full box-border"
                      style={{ boxSizing: "border-box" }}
                    />
                  </Field>

                  <Field className="gap-1.5">
                    <FieldLabel htmlFor="ownerName">
                      {t("operator.detailsOwnerLabel")}
                    </FieldLabel>
                    <Input
                      id="ownerName"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder={t("operator.detailsOwnerPlaceholder")}
                      required
                      disabled={isPending}
                      className="h-11 px-4 w-full box-border"
                      style={{ boxSizing: "border-box" }}
                    />
                  </Field>

                  {/* Conditional fields based on first step input type */}
                  {method === "email" ? (
                    <Field className="gap-1.5">
                      <FieldLabel htmlFor="operatorPhone">
                        {t("operator.detailsPhoneLabel")}
                      </FieldLabel>
                      <PhoneInput
                        id="operatorPhone"
                        value={operatorCollectedPhone}
                        onChange={(value) =>
                          setOperatorCollectedPhone(value ?? "")
                        }
                        required
                        disabled={isPending}
                        className="w-full box-border"
                        style={{ boxSizing: "border-box" }}
                      />
                    </Field>
                  ) : (
                    <Field className="gap-1.5">
                      <FieldLabel htmlFor="operatorEmail">
                        {t("operator.detailsEmailLabel")}
                      </FieldLabel>
                      <Input
                        id="operatorEmail"
                        type="email"
                        value={operatorCollectedEmail}
                        onChange={(e) =>
                          setOperatorCollectedEmail(e.target.value)
                        }
                        placeholder={t("operator.detailsEmailPlaceholder")}
                        required
                        disabled={isPending}
                        className="h-11 px-4 w-full box-border"
                        style={{ boxSizing: "border-box" }}
                      />
                    </Field>
                  )}

                  <Field orientation="horizontal">
                    <Checkbox
                      id="terms"
                      checked={acceptTerms}
                      onCheckedChange={(checked) =>
                        setAcceptTerms(checked as boolean)
                      }
                      disabled={isPending}
                    />
                    <FieldContent>
                      <FieldLabel htmlFor="terms" className="font-normal">
                        {t.rich("operator.detailsTerms", {
                          linkTerms: (chunks) => (
                            <Link
                              href="/terms"
                              className="text-primary hover:underline font-medium"
                            >
                              {chunks}
                            </Link>
                          ),
                          linkPrivacy: (chunks) => (
                            <Link
                              href="/privacy"
                              className="text-primary hover:underline font-medium"
                            >
                              {chunks}
                            </Link>
                          ),
                        })}
                      </FieldLabel>
                    </FieldContent>
                  </Field>
                </FieldGroup>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isPending || !detailsValid}
                >
                  {isPending
                    ? t("operator.detailsSubmitting")
                    : t("operator.detailsContinue")}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={() => {
                    setDirection(-1);
                    setStep("input");
                  }}
                  disabled={isPending}
                >
                  {t("operator.detailsGoBack")}
                </Button>
              </form>
            )}

            {/* OTP Step Form */}
            {step === "otp" && (
              <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
                <FieldGroup className="gap-4">
                  <Field className="gap-1.5">
                    <FieldLabel htmlFor="otp">
                      {t(`${userType}.otpLabel`)}
                    </FieldLabel>
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder={t(`${userType}.otpPlaceholder`)}
                      required
                      disabled={isPending}
                      className="h-11 w-full text-center font-mono text-lg tracking-[0.5em] box-border"
                      style={{ boxSizing: "border-box" }}
                      autoFocus
                    />
                  </Field>
                </FieldGroup>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isPending || otp.length < 6}
                >
                  {isPending ? (
                    <>
                      <Spinner className="size-4" />
                      {t(`${userType}.otpVerifying`)}
                    </>
                  ) : (
                    t(`${userType}.otpVerify`)
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={() => {
                    setDirection(-1);
                    setStep(
                      userType === "operator" && companyName
                        ? "details"
                        : "input",
                    );
                    setOtp("");
                  }}
                  disabled={isPending}
                >
                  {t(`${userType}.otpDifferent`)}
                </Button>
              </form>
            )}

            {/* Passenger Profile Setup Step Form */}
            {step === "profile" && (
              <form
                onSubmit={handleCompleteProfile}
                className="flex flex-col gap-4"
              >
                <FieldGroup className="gap-4">
                  <Field className="gap-1.5">
                    <FieldLabel htmlFor="fullName">
                      {t("passenger.profileNameLabel")}
                    </FieldLabel>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t("passenger.profileNamePlaceholder")}
                      required
                      disabled={isPending}
                      autoFocus
                      className="h-11 px-4 w-full box-border"
                      style={{ boxSizing: "border-box" }}
                    />
                  </Field>

                  <Field className="gap-1.5">
                    <FieldLabel htmlFor="preferredSeat">
                      {t("passenger.profileSeatLabel")}
                    </FieldLabel>
                    <Select
                      value={preferredSeat}
                      onValueChange={(val) =>
                        setPreferredSeat(val as "NONE" | "WINDOW" | "AISLE")
                      }
                      disabled={isPending}
                    >
                      <SelectTrigger
                        id="preferredSeat"
                        className="h-11 w-full rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary focus:ring-primary focus:border-primary"
                      >
                        <SelectValue
                          placeholder={t("passenger.profileSeatNone")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">
                          {t("passenger.profileSeatNone")}
                        </SelectItem>
                        <SelectItem value="WINDOW">
                          {t("passenger.profileSeatWindow")}
                        </SelectItem>
                        <SelectItem value="AISLE">
                          {t("passenger.profileSeatAisle")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field className="gap-1.5">
                    <FieldLabel htmlFor="preferredClass">
                      {t("passenger.profileClassLabel")}
                    </FieldLabel>
                    <Select
                      value={preferredClass}
                      onValueChange={(val) =>
                        setPreferredClass(val as "ECONOMY" | "STANDARD" | "VIP")
                      }
                      disabled={isPending}
                    >
                      <SelectTrigger
                        id="preferredClass"
                        className="h-11 w-full rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary focus:ring-primary focus:border-primary"
                      >
                        <SelectValue
                          placeholder={t("passenger.profileClassPlaceholder")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ECONOMY">
                          {t("passenger.profileClassEconomy")}
                        </SelectItem>
                        <SelectItem value="STANDARD">
                          {t("passenger.profileClassStandard")}
                        </SelectItem>
                        <SelectItem value="VIP">
                          {t("passenger.profileClassVip")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field
                    orientation="horizontal"
                    className="border-t border-border pt-4 justify-between"
                  >
                    <FieldContent>
                      <FieldLabel htmlFor="marketing">
                        {t("passenger.profileMarketingLabel")}
                      </FieldLabel>
                      <p className="text-sm text-muted-foreground leading-normal">
                        {t("passenger.profileMarketingDesc")}
                      </p>
                    </FieldContent>
                    <Switch
                      id="marketing"
                      checked={marketingOptIn}
                      onCheckedChange={setMarketingOptIn}
                      disabled={isPending}
                    />
                  </Field>
                </FieldGroup>

                <Button
                  type="submit"
                  className="w-full mt-2"
                  disabled={isPending || !fullName.trim()}
                >
                  {t("passenger.profileComplete")}
                </Button>
              </form>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
