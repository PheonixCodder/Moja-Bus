import Link from "next/link";
import { VerifyEmailForm } from "@/features/auth/components/verify-email-form";

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
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Moja Ride
          <span className="block text-sm font-normal text-muted-foreground">
            {isPassenger ? "Passenger Portal" : "Business Portal"}
          </span>
        </h1>
        <p className="text-sm text-muted-foreground max-w-md">
          {isPassenger
            ? "One last step - verify your email address to complete your passenger account setup."
            : "Verify your work email to complete your operator account registration."}
        </p>
      </div>
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
