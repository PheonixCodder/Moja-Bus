import { VerifyEmailForm } from "@/features/auth/components/verify-email-form";

type VerifyEmailViewProps = {
  email?: string | undefined;
};

export function VerifyEmailView({ email }: VerifyEmailViewProps) {
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Moja Bus</h1>
        <p className="text-sm text-muted-foreground">
          One last step - verify your email address
        </p>
      </div>
      <VerifyEmailForm email={email} />
    </div>
  );
}
