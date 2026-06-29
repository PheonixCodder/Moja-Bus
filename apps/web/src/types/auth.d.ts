// Custom auth types that extend the Better Auth defaults
// These types ensure that our custom fields (role, phone) are available

declare module "better-auth" {
  interface User {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    emailVerified: boolean;
    name: string;
    image?: string | null;
    role: "TRAVELER" | "OPERATOR" | "ADMIN";
    phone?: string;
  }
  
  interface Session {
    user: User;
    expiresAt: Date;
  }
}

declare module "better-auth/client" {
  interface EmailOTPSignUpOptions {
    phone?: string;
    role?: "TRAVELER" | "OPERATOR" | "ADMIN";
  }
}

// Re-export for easier usage
export type {} from "better-auth";