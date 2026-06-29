import Link from "next/link";
import { VerifyEmailForm } from "@/features/auth/components/verify-email-form";

type OperatorVerifyEmailViewProps = {
  email?: string | undefined;
};

export function OperatorVerifyEmailView({ email }: OperatorVerifyEmailViewProps) {
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
          Verify your work email to complete your operator account registration.
        </p>
      </div>
      <VerifyEmailForm email={email} userType="operator" />
      <p className="text-xs text-muted-foreground">
        Didn't receive a code? Check your spam folder or {
          <Link href="/operator/signup" className="font-medium text-primary hover:underline">
            try again
          </Link>
        }
      </p>
    </div>
  );
}
