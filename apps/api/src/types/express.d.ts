import type { AuthPrincipal } from "../auth/auth.types.js";

declare module "express-serve-static-core" {
  interface Request {
    auth?: AuthPrincipal;
  }
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPrincipal;
    }
  }
}
