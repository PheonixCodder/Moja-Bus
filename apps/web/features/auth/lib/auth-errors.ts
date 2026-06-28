const AUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked:
    "This email is already linked to another sign-in method. Please use your original sign-in method.",
  OAuthCallbackError: "OAuth sign-in failed. Please try again.",
  EmailSignInError: "Email sign-in failed. Please try again.",
  CredentialsSignin: "Invalid email or password.",
  SessionRequired: "Please sign in to continue.",
  Default: "Authentication failed. Please try again.",
};

export function getAuthErrorMessage(code?: string): string | null {
  if (!code) return null;
  const defaultMessage = "Authentication failed. Please try again.";
  return AUTH_ERROR_MESSAGES[code] ?? AUTH_ERROR_MESSAGES["Default"] ?? defaultMessage;
}
