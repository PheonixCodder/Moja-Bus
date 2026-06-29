import Link from "next/link";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

type ForgotPasswordViewProps = {
  userType?: "passenger" | "operator";
};

export function ForgotPasswordView({ userType = "passenger" }: ForgotPasswordViewProps) {
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
            ? "Forgot your password? We'll send a reset code to your email." 
            : "Reset your business account password. We'll send a code to your work email."
          }
        </p>
      </div>
      <ForgotPasswordForm userType={userType} />
      <p className="text-xs text-muted-foreground">
        {isPassenger ? "Remember your password? " : "Remember your password? "}
        <Link href={isPassenger ? "/login" : "/operator/login"} className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
