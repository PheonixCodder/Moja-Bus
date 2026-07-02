import Link from "next/link";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { AuthHeader } from "@/features/auth/components/auth-header";

type ForgotPasswordViewProps = {
  userType?: "passenger" | "operator";
};

export function ForgotPasswordView({
  userType = "passenger",
}: ForgotPasswordViewProps) {
  const isPassenger = userType === "passenger";

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <AuthHeader
        type={userType}
        description={
          isPassenger
            ? "Forgot your password? We'll send a reset code to your email."
            : "Reset your business account password. We'll send a code to your work email."
        }
      />
      <ForgotPasswordForm userType={userType} />
      <p className="text-xs text-muted-foreground">
        {isPassenger ? "Remember your password? " : "Remember your password? "}
        <Link
          href={isPassenger ? "/login" : "/operator/login"}
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
