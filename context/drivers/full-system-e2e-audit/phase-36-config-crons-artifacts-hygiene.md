# Phase 36 — Config, Crons & Artifacts Hygiene

> **Closes:** F-IN-07, F-IN-11, F-IN-14 · Evidence: `09-security-iam-crons-infra.md` §3/§5 + findings.
> Dual cron schedule sources with divergent cadences and dead vercel.json in a compose-deployed world; env drift — `TELEMETRY_TOKEN_SECRET` undocumented+unpassed, `REDIS_URL/KV_URL` documented nowhere, `CHECKOUT_QUOTE_SECRET` missing from web prod env, traveler Novu identifier var absent from examples; tracked junk `scripts/count-issues-output.txt` (UTF-16 mojibake), orphan vitest-style setup file, local logs.

## Objective
One authoritative cron source of truth; every consumed env var documented where it's consumed; repository free of committed junk.

## Tasks
- [ ] Declare `deploy/cron/crontab.template` authoritative (compose is prod): delete or clearly mark vercel.json as non-prod reference; add a unit test asserting every `/api/cron/*` route appears in the authoritative file (Phase 22 already touched cadences — build on it).
- [ ] Sync env: add `TELEMETRY_TOKEN_SECRET`, `REDIS_URL`, `CHECKOUT_QUOTE_SECRET`, traveler `EXPO_PUBLIC_NOVU_APPLICATION_IDENTIFIER` (+ any other consumed-but-undocumented vars) to the right `.env.example`s and compose passthroughs; remove unused `NEXT_PUBLIC_API_URL` from web env or wire it.
- [ ] Delete tracked junk (`count-issues-output.txt`, orphan `__tests__/setup/security-setup.ts` or wire it), gitignore local logs.

## Acceptance criteria
Route↔schedule parity test green; every env var read by code appears in an example file (grep-auditable); `git status` clean of junk artifacts.
