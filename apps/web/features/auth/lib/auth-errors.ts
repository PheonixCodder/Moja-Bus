const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // OAuth errors
  OAuthAccountNotLinked:
    "This email is already linked to another sign-in method. Please use your original sign-in method.",
  OAuthCallbackError: "OAuth sign-in failed. Please try again or use a different sign-in method.",
  OAuthCreateAccount: "Could not create account with this sign-in method. Please try a different method.",
  
  // Email/password errors
  EmailSignInError: "Email sign-in failed. Please check your email and password.",
  CredentialsSignin: "Invalid email or password. Please check your credentials and try again.",
  UserNotFound: "No account found with this email. Please check your email or sign up first.",
  InvalidPassword: "Incorrect password. Please try again or reset your password.",
  
  // Account status errors
  AccountNotVerified: "Please verify your email before signing in. Check your inbox for the verification link.",
  AccountDisabled: "Your account has been disabled. Please contact support for assistance.",
  AccountSuspended: "Your account has been suspended. Please contact support for assistance.",
  AccountBanned: "Your account has been banned. Please contact support for more information.",
  AccountLocked: "Your account is temporarily locked. Please try again later or reset your password.",
  
  // Verification errors
  VerificationFailed: "Email verification failed. Please request a new verification code.",
  VerificationExpired: "Verification code has expired. Please request a new one.",
  AlreadyVerified: "This account is already verified. You can sign in now.",
  
  // Rate limiting
  RateLimitExceeded: "Too many attempts. Please wait a few minutes before trying again.",
  TooManyRequests: "Too many requests. Please wait before trying again.",
  
  // Session errors
  SessionRequired: "Please sign in to continue.",
  SessionExpired: "Your session has expired. Please sign in again.",
  InvalidSession: "Invalid session. Please sign in again.",
  
  // Database constraints
  UniqueConstraintViolation: "An account with these details already exists. Please check your information.",
  PhoneAlreadyExists: "This phone number is already registered. Please use a different phone number.",
  EmailAlreadyExists: "This email is already registered. Please use a different email address.",
  WorkEmailAlreadyExists: "This work email is already registered. Please use a different business email.",
  
  // Default fallback
  Default: "Authentication failed. Please try again.",
};

export function getAuthErrorMessage(code?: string): string | null {
  if (!code) return null;
  const defaultMessage = "Authentication failed. Please try again.";
  return AUTH_ERROR_MESSAGES[code] ?? AUTH_ERROR_MESSAGES["Default"] ?? defaultMessage;
}

// Additional utility function to get error message from error objects
export function getErrorMessageFromError(error: unknown): string {
  if (!error) return "An unexpected error occurred. Please try again.";
  
  if (typeof error === "string") {
    return error;
  }
  
  if (typeof error === "object" && error && "message" in error) {
    const err = error as { message?: string; code?: string };
    
    // Check for Prisma error codes first
    if (err.code === "P2002") {
      return "An account with these details already exists. Please check your email or phone number.";
    }
    
    if (err.code === "P2001") {
      return "The requested record was not found. Please check your information.";
    }
    
    if (err.code === "P2003") {
      return "Referenced data not found. Please ensure all information is correct.";
    }
    
    // Fallback to the message or default
    if (err.message) {
      // Handle common error patterns
      if (err.message.includes("Unique constraint failed")) {
        if (err.message.includes("(phone)")) {
          return "This phone number is already registered. Please use a different phone number.";
        } else if (err.message.includes("(email)")) {
          return "This email is already registered. Please use a different email address.";
        } else if (err.message.includes("(workEmail)")) {
          return "This work email is already registered. Please use a different business email.";
        }
        return "An account with these details already exists. Please check your information.";
      }
      
      return err.message;
    }
  }
  
  return "An unexpected error occurred. Please try again.";
}
