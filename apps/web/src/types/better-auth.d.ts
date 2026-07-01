declare module "better-auth" {
  interface User {
    role: "TRAVELER" | "OPERATOR" | "ADMIN";
    phone?: string;
  }

  interface Session {
    user: User;
  }
}
