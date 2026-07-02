import Link from "next/link";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { AuthHeader } from "@/features/auth/components/auth-header";

export function OperatorForgotPasswordView() {
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <AuthHeader
        type="operator"
        description="Reset your business account password. We will send a code to your work email."
      />
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
