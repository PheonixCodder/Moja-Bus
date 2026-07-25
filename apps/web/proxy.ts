// proxy.ts — next-intl locale detection & routing middleware
// NOTE: In Next.js 16, the middleware entry point is proxy.ts (not middleware.ts).
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except:
  // - /api/*           (tRPC, auth, cron, webhooks, etc.)
  // - /_next/*         (Next.js internals)
  // - /favicon.ico     (static asset)
  // - Files with extensions (images, fonts, etc.)
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
