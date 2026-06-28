import { LoginForm } from "@/features/auth/components/login-form";

type LoginViewProps = {
  errorCode?: string | undefined;
};

export function LoginView({ errorCode }: LoginViewProps) {
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Moja Ride</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to book trips and manage your passenger account
        </p>
      </div>
      <LoginForm errorCode={errorCode} />
    </div>
  );
}
