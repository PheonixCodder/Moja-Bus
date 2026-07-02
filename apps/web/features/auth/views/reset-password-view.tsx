import Link from "next/link";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { AuthHeader } from "@/features/auth/components/auth-header";

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
      <AuthHeader
        type={userType}
        description={
          isPassenger
            ? "Enter the code we sent to your email and choose a new password."
            : "Enter the code we sent to your work email and set a new password."
        }
      />
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
