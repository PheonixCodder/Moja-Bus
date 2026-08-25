# Phase 01 — CI Quality Gate

> **Closes:** F-IN-05 (P1), F-IN-06 (P2) · Evidence: `09-security-iam-crons-infra.md` §7 + findings; `.github/workflows/deploy.yml`.
> **Status: 🟡 CODE COMPLETE 2026-08-23** — local gates green (typecheck 10/10 · turbo test 8/8 tasks incl. web 413/413 + schemas 78/78) · red/green proven locally (exit 1 broken / exit 0 restored) · **CI end-to-end red/green pending next master push** (each master push deploys to prod — run it deliberately, ideally after Phase 00 merges).
> **Ratified 2026-08-23:** D5-A consolidate stale hierarchy suites · D6 noted (outbox 2/2 ✅, authorize 29/29 ✅ pass clean today) · D7-A probe-then-decide traveler-app · D8-A `turbo lint` · D9 branch-protection = user action · Postgres service already provisioned by Phase 00's `db-drift.yml` (reuse pattern, no second service needed for now).

## Objective
Master deploys become impossible without green tests and lint, and the four never-run suites are wired with their stale expectations reconciled to the shipped RBAC model.

## Exploration findings this phase builds on (2026-08-23)
- Exactly 4 orphans confirmed (50 wired / 54 on disk).
- `outbox.test.ts` 2/2 pass, `authorize.test.ts` 29/29 pass → pure wiring.
- `features/operator/lib/__tests__/staff-hierarchy.test.ts` FAILS and schemas
  `roles-and-permissions.test.ts` FAILS: both encode the pre-DRIVER model
  (`OPERATIONS` assigns nothing; `MANAGER` assigns FINANCE/OPERATIONS;
  `OPERATIONS > DISPATCHER`) that the shipped engine deliberately reversed
  (`DISPATCHER 350 > OPERATIONS 300`, `OPERATIONS → [DRIVER]`,
  `MANAGER → [SUPPORT,TREASURY,DISPATCHER,CONDUCTOR,DRIVER]`). Audit verified
  the shipped maps as intentional.

## Tasks (final, ratified)
- [x] Wire the two passing orphans into `apps/web/package.json` test list:
      `features/notifications/outbox/__tests__/outbox.test.ts`, `lib/__tests__/permissions/authorize.test.ts`. *(Both appended after `driver-run-state.test.ts`; web suite now 413 tests / 121 suites, green.)*
- [x] Execute D5-A consolidation:
      - Delete `features/operator/lib/__tests__/staff-hierarchy.test.ts` (duplicate of schemas coverage with stale expectations). *(Deleted — baseline before deletion: 9/15 pass / 6 fail on the stale model.)*
      - Rewrite StaffRole-hierarchy assertions in `packages/schemas/src/__tests__/roles-and-permissions.test.ts`
        to assert the SHIPPED model (levels incl. DRIVER 150 / DISPATCHER 350,
        ASSIGNABLE_ROLES incl. OPERATIONS→[DRIVER], canModifyMember strict-greater semantics).
        Wire it into the schemas test script. This encodes "shipped hierarchy is correct" — if anyone
        disputes the model itself, that is a code change in a different phase, not a test edit.
        *(Rewritten: exact level values, shipped ordering chain, per-role ASSIGNABLE_ROLES deepEquals,
        DRIVER narrow-template invariant (Phase-17 D2), same-role-modifies-nobody loop, strict-greater
        reversal cases. Baseline failure was exactly the reversed assertion (`OPERATIONS > DISPATCHER`);
        post-rewrite schemas suite 78/78. Biome-clean on the rewritten file.)*
- [x] D7-A traveler probe: `pnpm --filter traveler-app exec tsc --noEmit`. Clean → add to the gate's typecheck filter removal.
      Failing → capture errors, time-box fixes ≤½ day inside this phase, else keep excluded + file a tracked follow-up finding.
      *(Result: CLEAN — exit 0, zero errors, 2026-08-23. traveler-app included via unfiltered `turbo run typecheck`; full-workspace typecheck 10/10 tasks green.)*
- [x] Workflow (`deploy.yml` quality-gate): order = `turbo run typecheck` (per D7 outcome) → `pnpm turbo test` → `pnpm exec turbo run lint` (D8-A). Keep build-and-push strictly `needs:` gated.
      *(All three steps landed in that order; `build-and-push.needs: quality-gate` unchanged. ⚠️ DEVIATION on lint, see below.)*
- [x] Policy note in workflow comment: newly-exposed failures are fixed here only if they're TEST bugs; product bugs get filed into the relevant phase.
- [x] Drop the unused `DATABASE_URL` env from the quality-gate job (typecheck doesn't need a live DB) — optional hygiene while editing. *(Verified safe: DATABASE_URL unset in shell while full web+schemas suites ran green.)*
- [x] D9 handoff: report required-check names (`quality-gate`, `drift-check`) for branch protection on master (user flips in GitHub settings). *(Names unchanged by this phase; user action pending.)*

## Deviation from D8-A (flagged for ratification)
`turbo run lint` is **wired but report-only** (`continue-on-error: true`) with an inline comment to flip it
blocking once cleared. Reason: pre-existing biome debt across ALL 10 packages with lint scripts
(~120 diagnostics: mostly formatter drift + organizeImports; rule hits incl. noUnusedImports,
useLiteralKeys, useImportType, useNodejsImportProtocol, noNonNullAssertion, noExplicitAny,
noImportantStyles). Landing it blocking would have meant either a repo-wide format sweep entangled
with ~70 files of unrelated uncommitted work, or a permanently-red gate. Per the policy note, this
debt belongs to its own cleanup session, not Phase 01. **Follow-up filed:** enforce blocking lint +
repo-wide biome cleanup (candidate slot: alongside Phase 36 hygiene).

## Acceptance criteria
- `pnpm turbo test` runs all suites including all four ex-orphans, green. *(✅ 8/8 turbo tasks; web 413/413 incl. outbox+authorize; schemas 78/78 incl. roles-and-permissions.)*
- A deliberately failing test blocks the deploy workflow end-to-end (red/green proof). *(Local proof: injected failing assert into outbox.test.ts → `turbo run test --force` exit **1**, `Failed: web#test`; reverted → exit **0**, 8/8. CI end-to-end runs on next deliberate master push.)*
- Hierarchy semantics have exactly ONE executable specification (schemas suite). *(✅ web duplicate deleted; grep-auditable: roles-and-permissions.test.ts is the only StaffRole-hierarchy spec.)*

## Verification
- Suite counts: **56 on disk / 56 wired / 0 orphans** (audit baseline: 54 disk / 50 wired; deltas = suites added by Phases 02/04/06 + staff-hierarchy deletion).
- Traveler probe output recorded above (clean).
- Red/green exit codes recorded above.
- Gates at close: `turbo typecheck` 10/10 ✅ · `turbo test` 8/8 ✅ · biome clean on touched files ✅ (`deploy.yml`, both package.json, rewritten test).

## Remaining to fully close (user actions)
1. Merge/push so CI executes the new gate end-to-end; capture red/green workflow runs (a deliberate red can be staged on a throwaway PR — `pull_request` triggers `db-drift.yml` only, so a red-proof on master must be watched carefully since master pushes deploy).
2. Flip branch protection on master: required checks `quality-gate` + `drift-check` (D9).
3. Ratify the lint report-only deviation (or order the cleanup sweep first).

## Risks / rollback
Stale-suite reconciliation could mask real regressions if the shipped maps were wrong — mitigated by the audit's independent verification of current maps as deliberate; flag any dispute before merging. Rollback = revert `.github/workflows/deploy.yml` + the two package.json test lists + restore deleted suite from git history.
