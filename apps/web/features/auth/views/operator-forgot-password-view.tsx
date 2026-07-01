import Link from "next/link";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export function OperatorForgotPasswordView() {
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Moja Ride
          <span className="block text-sm font-normal text-muted-foreground">
            for Business
          </span>
        </h1>
        <p className="text-sm text-muted-foreground max-w-md">
          Reset your business account password. We will send a code to your work
          email.
        </p>
      </div>
      <ForgotPasswordForm userType="operator" />
      <p className="text-xs text-muted-foreground">
        Remember your password?{" "}
        {
          <Link
            href="/operator/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        }
      </p>
    </div>
  );
}
