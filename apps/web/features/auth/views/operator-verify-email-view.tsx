import Link from "next/link";
import { VerifyEmailForm } from "@/features/auth/components/verify-email-form";
import { AuthHeader } from "@/features/auth/components/auth-header";

type OperatorVerifyEmailViewProps = {
  email?: string | undefined;
};

export function OperatorVerifyEmailView({
  email,
}: OperatorVerifyEmailViewProps) {
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <AuthHeader
        type="operator"
        description="Verify your work email to complete your operator account registration."
      />
      <VerifyEmailForm email={email} userType="operator" />
      <p className="text-xs text-muted-foreground">
        Didn't receive a code? Check your spam folder or{" "}
        {
          <Link
            href="/operator/signup"
            className="font-medium text-primary hover:underline"
          >
            try again
          </Link>
        }
      </p>
    </div>
  );
}
