declare module "better-auth" {
  interface User {
    role: "TRAVELER" | "AGENT" | "DRIVER" | "OPERATOR" | "ADMIN";
    phone?: string;
  }
  
  interface Session {
    user: User;
  }
}