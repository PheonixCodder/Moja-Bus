import Link from "next/link";
import { VerifyEmailForm } from "@/features/auth/components/verify-email-form";
import { AuthHeader } from "@/features/auth/components/auth-header";

type VerifyEmailViewProps = {
  email?: string | undefined;
  userType?: "passenger" | "operator";
};

export function VerifyEmailView({
  email,
  userType = "passenger",
}: VerifyEmailViewProps) {
  const isPassenger = userType === "passenger";

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <AuthHeader
        type={userType}
        description={
          isPassenger
            ? "One last step - verify your email address to complete your passenger account setup."
            : "Verify your work email to complete your operator account registration."
        }
      />
      <VerifyEmailForm email={email} userType={userType} />
      <p className="text-xs text-muted-foreground">
        Didn't receive a code? Check your spam folder or{" "}
        {
          <Link
            href={isPassenger ? "/signup" : "/operator/signup"}
            className="font-medium text-primary hover:underline"
          >
            try again
          </Link>
        }
      </p>
    </div>
  );
}
