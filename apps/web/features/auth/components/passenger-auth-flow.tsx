"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { authClient } from "@/lib/auth-client";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { Switch } from "@moja/ui/components/ui/switch";
import { Checkbox } from "@moja/ui/components/ui/checkbox";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { PhoneInput } from "@moja/ui/components/ui/phone-input";
import { Smartphone, Mail, User, Sparkles, Building } from "lucide-react";

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
}: { 
  userType?: "passenger" | "operator" | undefined;
  initialStep?: AuthStep | undefined;
  initialUser?: { email?: string; phone?: string } | undefined;
}) {
  const { isPending: authPending, sendPassengerOtp, verifyPassengerOtp } = useAuth();
  const trpc = useTRPC();
  const router = useRouter();

  const [step, setStep] = useState<AuthStep>(initialStep);
  const [direction, setDirection] = useState(1);
  const [identifier, setIdentifier] = useState(
    initialUser ? (initialUser.email || initialUser.phone || "") : ""
  );
  const [method, setMethod] = useState<"phone" | "email">(
    initialUser && initialUser.phone ? "phone" : "email"
  );
  const [otp, setOtp] = useState("");

  // Passenger Profile setup states (for new travelers)
  const [fullName, setFullName] = useState("");
  const [preferredSeat, setPreferredSeat] = useState<"WINDOW" | "AISLE" | "NONE">("NONE");
  const [preferredClass, setPreferredClass] = useState<"ECONOMY" | "STANDARD" | "VIP" | "BUSINESS">("ECONOMY");
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  // Operator Company details states (for new operators)
  const [companyName, setCompanyName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [operatorCollectedEmail, setOperatorCollectedEmail] = useState("");
  const [operatorCollectedPhone, setOperatorCollectedPhone] = useState("");

  // TRPC Mutations
  const updatePreferencesMutation = useMutation(
    trpc.passenger.updatePreferences.mutationOptions({
      onSuccess: () => {
        toast.success("Profile setup complete!");
        router.push("/dashboard");
        router.refresh();
      },
      onError: (err) => {
        toast.error(err.message || "Failed to complete profile setup.");
      },
    })
  );

  const checkAccountStatusMutation = useMutation(
    trpc.operator.checkAccountStatus.mutationOptions()
  );

  const initSignupMutation = useMutation(
    trpc.operator.initSignup.mutationOptions()
  );

  const detectMethod = (input: string): "phone" | "email" => {
    const cleanInput = input.trim();
    if (
      cleanInput.startsWith("+225") ||
      cleanInput.startsWith("07") ||
      cleanInput.startsWith("05") ||
      cleanInput.startsWith("01") ||
      /^[0-9\s+\-()]+$/.test(cleanInput)
    ) {
      return "phone";
    }
    return "email";
  };

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    const detectedMethod = detectMethod(identifier);
    setMethod(detectedMethod);

    let finalIdentifier = identifier.trim();
    if (detectedMethod === "phone" && !finalIdentifier.startsWith("+")) {
      if (finalIdentifier.length === 10) {
        finalIdentifier = `+225${finalIdentifier}`;
      }
    }

    if (userType === "operator") {
      try {
        const res = await checkAccountStatusMutation.mutateAsync({
          identifier: finalIdentifier,
        });

        if (res.exists) {
          if (res.role === "TRAVELER") {
            toast.error("This identifier is registered to a passenger account. Please use a unique business credential.");
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
          toast.success("Verification code sent!");
        } else {
          // New Operator -> transition to details form
          setDirection(1);
          setStep("details");
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to check account status.");
      }
    } else {
      // Passenger flow
      const { success } = await sendPassengerOtp(finalIdentifier, detectedMethod);
      if (success) {
        setDirection(1);
        setStep("otp");
      }
    }
  }

  async function handleOperatorDetailsSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim() || !ownerName.trim()) return;

    const emailVal = method === "email" ? identifier.trim() : operatorCollectedEmail.trim();
    const phoneVal = method === "phone" ? identifier.trim() : operatorCollectedPhone.trim();

    if (!emailVal) {
      toast.error("Please enter a valid work email address.");
      return;
    }
    if (!phoneVal) {
      toast.error("Please enter a valid phone number.");
      return;
    }
    if (!acceptTerms) {
      toast.error("Please accept the terms and conditions to continue.");
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
      toast.success("Verification code sent!");
    } catch (err: any) {
      toast.error(err.message || "Failed to initialize business registration.");
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    let finalIdentifier = identifier.trim();
    if (method === "phone" && !finalIdentifier.startsWith("+") && finalIdentifier.length === 10) {
      finalIdentifier = `+225${finalIdentifier}`;
    }

    if (userType === "operator") {
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

        toast.success(`Welcome to ${process.env["NEXT_PUBLIC_APP_NAME"] || "Moja Ride"}!`);

        const isNewUser = new Date(res.data.user.createdAt).getTime() > Date.now() - 10000;
        if (isNewUser) {
          router.push("/dashboard/operator/onboarding");
        } else {
          router.push("/dashboard/operator");
        }
        router.refresh();
      } catch (err: any) {
        let msg = "Invalid verification code.";
        if (err && typeof err === "object") {
          const code = err.code;
          if (code === "TOO_MANY_ATTEMPTS") {
            msg = "Too many attempts. Please request a new code later.";
          } else if (code === "INVALID_OTP") {
            msg = "Invalid verification code. Please check and try again.";
          } else if (code === "OTP_EXPIRED") {
            msg = "Verification code has expired. Please request a new code.";
          } else if (err.message) {
            msg = err.message;
          }
        }
        toast.error(msg);
      }
    } else {
      // Passenger verify
      const res = await verifyPassengerOtp(finalIdentifier, otp, method);
      if (res.success) {
        if (res.isNewUser) {
          setDirection(1);
          setStep("profile");
        } else {
          router.push("/dashboard");
          router.refresh();
        }
      }
    }
  }

  async function handleCompleteProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 2) {
      toast.error("Please enter a valid name (at least 2 characters).");
      return;
    }

    updatePreferencesMutation.mutate({
      fullName: fullName.trim(),
      preferredSeat,
      preferredClass,
      marketingOptIn,
    });
  }

  const isPending =
    authPending ||
    updatePreferencesMutation.isPending ||
    checkAccountStatusMutation.isPending ||
    initSignupMutation.isPending;

  return (
    <div className="w-full max-w-md overflow-hidden">
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-card border border-border rounded-2xl shadow-sm w-full"
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
            className="p-6 flex flex-col gap-6"
          >
            {/* Header section based on step */}
            <div className="flex flex-col gap-1.5">
              <h3 className="font-semibold text-xl tracking-tight text-card-foreground">
                {step === "input" && (userType === "passenger" ? "Welcome to Moja Ride" : "Business Portal")}
                {step === "details" && "Register Your Business"}
                {step === "otp" && "Verify Your Account"}
                {step === "profile" && "Complete Your Profile"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {step === "input" && (userType === "passenger" ? "Enter your phone number or email to continue." : "Enter your work email or phone to sign in.")}
                {step === "details" && "Tell us about your company to get started."}
                {step === "otp" && `We sent a 6-digit verification code to ${identifier}.`}
                {step === "profile" && "Please enter your name and preferences to complete registration."}
              </p>
            </div>

            {/* Input Step Form */}
            {step === "input" && (
              <form onSubmit={handleSendCode} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="identifier" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {userType === "passenger" ? "Phone Number or Email" : "Work Email or Phone"}
                  </Label>
                  <div className="relative">
                    <Input
                      id="identifier"
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={userType === "passenger" ? "07 00 00 00 00 or you@example.com" : "you@company.com or phone"}
                      required
                      disabled={isPending}
                      className="h-10 border-border pr-10 focus-visible:ring-primary"
                      autoFocus
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                      {detectMethod(identifier) === "phone" ? (
                        <Smartphone className="h-4 w-4" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </div>
                <Button type="submit" className="w-full h-10 font-semibold" disabled={isPending || !identifier.trim()}>
                  {isPending ? "Checking status..." : "Continue"}
                </Button>
              </form>
            )}

            {/* Company Details Step Form (Operators Only) */}
            {step === "details" && (
              <form onSubmit={handleOperatorDetailsSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="companyName" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Company Name
                  </Label>
                  <div className="relative">
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Express Transit"
                      required
                      disabled={isPending}
                      className="h-10 border-border pr-10 focus-visible:ring-primary"
                      autoFocus
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                      <Building className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="ownerName" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Your Full Name
                  </Label>
                  <div className="relative">
                    <Input
                      id="ownerName"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="Your legal name"
                      required
                      disabled={isPending}
                      className="h-10 border-border pr-10 focus-visible:ring-primary"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                      <User className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                {/* Conditional fields based on first step input type */}
                {method === "email" ? (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="operatorPhone" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Phone Number
                    </Label>
                    <PhoneInput
                      id="operatorPhone"
                      value={operatorCollectedPhone}
                      onChange={(value) => setOperatorCollectedPhone(value ?? "")}
                      placeholder="+225 07 00 00 00 00"
                      country="CI"
                      defaultCountry="CI"
                      international={false}
                      required
                      disabled={isPending}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="operatorEmail" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Work Email
                    </Label>
                    <div className="relative">
                      <Input
                        id="operatorEmail"
                        type="email"
                        value={operatorCollectedEmail}
                        onChange={(e) => setOperatorCollectedEmail(e.target.value)}
                        placeholder="you@company.com"
                        required
                        disabled={isPending}
                        className="h-10 border-border pr-10 focus-visible:ring-primary"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                        <Mail className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2 pt-2">
                  <Checkbox
                    id="terms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                    disabled={isPending}
                  />
                  <Label
                    htmlFor="terms"
                    className="text-xs text-muted-foreground cursor-pointer leading-normal"
                  >
                    I accept the{" "}
                    <Link href="/terms" className="text-primary hover:underline font-medium">
                      Terms and Conditions
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-primary hover:underline font-medium">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>

                <Button type="submit" className="w-full h-10 font-semibold mt-2" disabled={isPending}>
                  {isPending ? "Submitting..." : "Continue"}
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-xs font-semibold text-muted-foreground hover:bg-transparent"
                  onClick={() => {
                    setDirection(-1);
                    setStep("input");
                  }}
                  disabled={isPending}
                >
                  Go Back
                </Button>
              </form>
            )}

            {/* OTP Step Form */}
            {step === "otp" && (
              <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="otp" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Verification Code
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    required
                    disabled={isPending}
                    className="h-10 border-border text-center font-mono text-lg tracking-[0.5em] focus-visible:ring-primary"
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full h-10 font-semibold" disabled={isPending || otp.length < 6}>
                  {isPending ? "Verifying..." : "Verify and Sign In"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-xs font-semibold text-muted-foreground hover:bg-transparent"
                  onClick={() => {
                    setDirection(-1);
                    setStep(userType === "operator" && companyName ? "details" : "input");
                    setOtp("");
                  }}
                  disabled={isPending}
                >
                  Use a different phone or email
                </Button>
              </form>
            )}

            {/* Passenger Profile Setup Step Form */}
            {step === "profile" && (
              <form onSubmit={handleCompleteProfile} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="fullName" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Full Name
                  </Label>
                  <div className="relative">
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. John Doe"
                      required
                      disabled={isPending}
                      className="h-10 border-border pr-10 focus-visible:ring-primary"
                      autoFocus
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                      <User className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="preferredSeat" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Seat Preference
                  </Label>
                  <select
                    id="preferredSeat"
                    value={preferredSeat}
                    onChange={(e) => setPreferredSeat(e.target.value as any)}
                    disabled={isPending}
                    className="h-10 rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="NONE">No preference</option>
                    <option value="WINDOW">Window Seat</option>
                    <option value="AISLE">Aisle Seat</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="preferredClass" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Travel Class
                  </Label>
                  <select
                    id="preferredClass"
                    value={preferredClass}
                    onChange={(e) => setPreferredClass(e.target.value as any)}
                    disabled={isPending}
                    className="h-10 rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="ECONOMY">Economy Class</option>
                    <option value="STANDARD">Standard Class</option>
                    <option value="BUSINESS">Business Class</option>
                    <option value="VIP">VIP Class</option>
                  </select>
                </div>

                <div className="border-t border-border pt-4 flex items-center justify-between">
                  <div className="space-y-0.5 max-w-[280px]">
                    <Label htmlFor="marketing" className="text-xs font-bold text-text-primary">
                      Marketing & Promotions
                    </Label>
                    <p className="text-[10px] text-muted-foreground leading-normal">
                      Receive discount codes, vouchers, and travel deal alerts.
                    </p>
                  </div>
                  <Switch
                    id="marketing"
                    checked={marketingOptIn}
                    onCheckedChange={setMarketingOptIn}
                    disabled={isPending}
                  />
                </div>

                <Button type="submit" className="w-full h-10 font-semibold gap-2 mt-2" disabled={isPending || !fullName.trim()}>
                  {isPending && <Spinner className="w-4 h-4 text-white" />}
                  <Sparkles className="h-4 w-4" />
                  Complete Registration
                </Button>
              </form>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
