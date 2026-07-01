import Link from "next/link";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

type ResetPasswordViewProps = {
  email: string;
  userType?: "passenger" | "operator";
};

export function ResetPasswordView({
  email,
  userType = "passenger",
}: ResetPasswordViewProps) {
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
            ? "Enter the code we sent to your email and choose a new password."
            : "Enter the code we sent to your work email and set a new password."}
        </p>
      </div>
      <ResetPasswordForm email={email} userType={userType} />
      <p className="text-xs text-muted-foreground">
        Didn't receive a code?{" "}
        {
          <Link
            href={
              isPassenger ? "/forgot-password" : "/operator/forgot-password"
            }
            className="font-medium text-primary hover:underline"
          >
            Resend code
          </Link>
        }
      </p>
    </div>
  );
}
