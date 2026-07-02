import Link from "next/link";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { AuthHeader } from "@/features/auth/components/auth-header";

type OperatorResetPasswordViewProps = {
  email: string;
};

export function OperatorResetPasswordView({
  email,
}: OperatorResetPasswordViewProps) {
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <AuthHeader
        type="operator"
        description="Enter the code we sent to your work email and set a new password for your business account."
      />
      <ResetPasswordForm email={email} userType="operator" />
      <p className="text-xs text-muted-foreground">
        Didn't receive a code?{" "}
        {
          <Link
            href="/operator/forgot-password"
            className="font-medium text-primary hover:underline"
          >
            Resend code
          </Link>
        }
      </p>
    </div>
  );
}
