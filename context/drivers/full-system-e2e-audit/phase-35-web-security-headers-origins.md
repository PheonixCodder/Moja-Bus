# Phase 35 — Web Security Headers & Origins

> **Closes:** F-IN-08, F-IN-09, F-IN-10, F-IN-16 · Evidence: `09-security-iam-crons-infra.md` §6 + findings.
> CSRF: missing Origin allowed, malformed Origin → INTERNAL not FORBIDDEN (`init.ts:79-88`); Next image optimizer `hostname:"**"` + no CSP anywhere (`next.config.ts:27-32`, Caddyfile); Caddy `Permissions-Policy "geolocation=()"` kills browser geolocation on a GPS product; Better Auth trustedOrigins permanently includes localhost + bare `exp://` even in prod (`auth-server.ts:14-39`).

## Objective
Browser-facing security posture matches a money-handling product without breaking mobile clients (which send no Origin by design).

## Tasks
- [ ] tRPC CSRF: wrap Origin parse in try/catch → FORBIDDEN on malformed; document the no-Origin bypass rationale inline.
- [ ] Constrain `images.remotePatterns` to known CDNs/hosts; add baseline CSP at Caddy (report-only first, then enforce after QA).
- [ ] Fix Permissions-Policy geolocation to allow self (capture/geocode features need it).
- [ ] Gate localhost + bare-scheme trustedOrigins behind NODE_ENV (keep explicit prod origins + app schemes).
- [ ] Header/CSP verification against key pages (booking, tickets, blog) with no console violations.

## Acceptance criteria
Malformed-origin mutations get FORBIDDEN; CSP enforced without breaking surfaces; geolocation works in-browser for capture flow; prod auth origins contain no localhost.

## Verification
Header dump + capture-flow browser QA + mobile regression check (OTP still works from both apps).
