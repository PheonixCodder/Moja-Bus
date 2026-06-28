import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

type ResetPasswordViewProps = {
  email: string;
};

export function ResetPasswordView({ email }: ResetPasswordViewProps) {
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Moja Bus</h1>
        <p className="text-sm text-muted-foreground">
          Enter the code and choose a new password
        </p>
      </div>
      <ResetPasswordForm email={email} />
    </div>
  );
}
