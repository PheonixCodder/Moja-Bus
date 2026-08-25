# 10 — Cross-Cutting Observations: Mock Surfaces, Doc Drift & First-Hand UI Findings

> **Source:** lead auditor's first-hand read of every file in `apps/driver-app` + all context docs, cross-checked against agent evidence. Items already filed in domain files are cross-referenced, not re-argued.

---

## 1. Simulated/mock surfaces still user-facing (honesty inventory)

| Surface | What renders | Evidence | Disposition |
|---|---|---|---|
| Operator "Live Fleet Map" | CSS dot-grid "radar" + lat/lng text; page metadata claims real-time tracking | F-OP-01 / F-TM-12 | Relabel or ship a map |
| Driver Live HUD | Random-walked speed (55–115), simulated heading drives puck/camera/overspeed banner; hardcoded "ETA: 24 mins"; static "Adaptive Mode: 5s Dynamic" label while true adaptive intervals are NOT implemented (fixed 5 s) | F-TM-11; live.tsx:74-109, 313-315, 327; telemetry.ts:328-330 | Wire watchPositionAsync or last-ping query |
| Driver Profile affiliations fallback | Fake "UTB Intercity Express • Badge DRV-084 • Active" card shown when driver has NO affiliations — presents fiction as fact on the career passport | profile.tsx:377-393 (first-hand) | Replace with honest empty-state |
| Earnings figures | Hardcoded ×50 XOF/min placeholder math (known scope statement) | drivers.ts:1888-1889; F-DV-11 | Pay-rate model (roadmap) |
| Traveler tracking | Honest "coming soon" card behind default-OFF flag ✅ best-in-class honesty | F-TM-15 state | Fix bookingId wiring before enabling |
| `broadcastTripAnnouncement` | Validated echo stub — no persistence/fan-out | drivers.ts:1746-1765 | Ship or remove UI |
| Rebooking notifier | "SMS" is console.log stub; operator toast implies passenger notified | rebooking-notifier.ts:30-34; F-PS-16 | Route via outbox |

## 2. First-hand driver-app UI defects (lead auditor)

1. **Four raw `<div>` elements remain in the registration wizard** — same Android red-screen class as the fixed P0-5 earnings bug. Every NEW-driver self-registration screen crashes Android: `register/index.tsx:116`, `license.tsx:122`, `documents.tsx:98`, `carrier.tsx:99` (each with closing tag). Combined with **F-DV-01** (fresh DB can't even run) this means the self-registration path is doubly broken for any new environment.
2. `offers.tsx:270` uses raw `alert()` for generic offer errors instead of Toast (inconsistent with the rest of the app).
3. Login OTP success routes straight to `/(tabs)/trips` (`login.tsx:153`), bypassing the `app/index.tsx` service-preference gate — the marketplace-preference gate only runs on cold start, so fresh logins skip it until app restart.
4. Notifications screen pulls its strings from the **offers** namespace (`useTranslation("offers")`, notifications.tsx:104) — works, but misplaced.
5. Scanner result sheet blocks re-scan correctly (`isScanningRef` + `validationResult` gating) ✓; torch toggle, JSON-token unwrap present ✓ — scanner UX itself is solid apart from F-PS-03.
6. Locale parity verified clean across all 9 namespaces en↔fr (script-checked key sets identical).

## 3. Documentation drift (workspace-rule violation — CLAUDE.md requires trackers stay current)

| Item | progress-tracker.md | remediation-plan.md | memory.md |
|---|---|---|---|
| Phase 18.4 WS hosting | `[ ]` open | `[x]` done | — |
| Phase 18.5 fanout/flush | `[ ]` open | `[x]` done | — |
| Phase 18.6 rate limit | `[x]` done | `[ ]` open | — |
| Phase 19.2–19.4 batches | `[ ]` open | `[x]` all done | "19.2–19.5 open" |

Code truth (this audit): 18.4 mitigated-but-open (flag off, consumer missing — F-TM-01), 18.5 partially (flush fixed, fanout documented-open — F-TM-08/09), 18.6 **done** (init.ts:99-137), 19.2–19.4 substantively landed (web/traveler edits verified by passenger/operator auditors). The three sources disagree with each other AND partially with code. Recommend one reconciliation pass marking code-truth, then freezing.

Also: audit `00-INDEX.md` says "8×P1, 15×P3" vs catalog's authoritative 7×P1/13×P3 (previously noted in memory.md — now superseded by this v2 audit entirely).

## 4. Component registry drift

`context/drivers/ui-registry.md` §2 lists six driver-app components (`DriverShiftHeader`, `ActiveTripHud`, `StopChecklistCard`, `QrTicketScanner`, `PassengerManifestList`, `DriverCareerPassport`) that **do not exist as files** — the functionality was built inline inside screens. Registry should reflect reality or the inline components should be extracted.

## 5. Version/config pins to verify before release

- `@rnmapbox/maps` JS ^10.3.5 over native pin 11.18.0 (both apps) — caret JS range must be validated by an actual EAS build (F-TM-19).
- `nativewind: "preview"` + `react-native-css: latest` floating pins in driver-app package.json — reproducibility risk for release builds.
- Expo SDK ~57 line is consistent across apps ✓.

## 6. Test/debt posture (from security auditor, actionable here)

~440 test blocks exist; CI runs none; four suites orphaned; zero tests for the drivers router, assignment engine, scoring, telemetry validator, cron services — i.e., every subsystem this audit found broken in. Any remediation phase should start by wiring the orphaned suites into runners + adding the CI gate (F-IN-05/F-IN-06), so fixes land with regression protection.
