import Link from "next/link";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

type OperatorResetPasswordViewProps = {
  email: string;
};

export function OperatorResetPasswordView({ email }: OperatorResetPasswordViewProps) {
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
          Enter the code we sent to your work email and set a new password for your business account.
        </p>
      </div>
      <ResetPasswordForm email={email} userType="operator" />
      <p className="text-xs text-muted-foreground">
        Didn't receive a code? {
          <Link href="/operator/forgot-password" className="font-medium text-primary hover:underline">
            Resend code
          </Link>
        }
      </p>
    </div>
  );
}
