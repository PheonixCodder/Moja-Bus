import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export function ForgotPasswordView() {
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Moja Ride</h1>
        <p className="text-sm text-muted-foreground">
          We&apos;ll send a reset code to your email inbox
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
