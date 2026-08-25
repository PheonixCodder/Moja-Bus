# Phase 15 — Registration Documents & Preferences Pipeline

> **Closes:** F-DV-05 (P2) · Evidence: `03-driver-registration-auth.md` registration data-map + finding.
> **Status: ✅ CODE COMPLETE 2026-08-23** — migration `20260824000000_phase15_driver_national_id` rehearsed on a clean volume (drift 0); gates green (19/19 · web 440 · driver-app 10 · schemas 86). Staging legs: full self-registration with live S3 → documents visible in both verification hubs; unmatched code shows the honest no-carrier state.
> **RIDE-ALONG FIX (2026-08-25, during Phases 25–27):** the "documents visible in BOTH verification hubs" leg was structurally broken — the key→presigned-GET swap landed in `getDriver` (operator passport) only; `admin.listDriversForVerification` kept returning raw storage keys, so admin dossiers rendered "missing" placeholders for every key-based document (the audit's F-OP-16 secondary symptom). Fixed by mirroring `presignDoc` into the admin list (legacy URLs pass through; failed presign degrades to placeholder without blocking the hub). Web tsc ✓.
> **D7/D8 corrected during challenge**: `employmentType` reuses the existing `DriverServicePreference.preferredType` (Phase 09) instead of duplicating it on DriverProfile; the new column is only `nationalIdNumber`.

## Tasks
- [x] Storage: four private, versioned, user-scoped purposes — `driver-license-front`, `driver-license-back`, `driver-selfie`, `driver-medical-doc` (pdf+image limits; selfie image-hinted). Registry + IAM enforcement already keyed uploads under `ctx.user.id`, so captures work before any profile/company exists.
- [x] Wizard: every capture presigns and PUTs immediately (`lib/driver-doc-upload.ts`); local preview URI stays client-side while the STORE holds the server object key — a failed upload blocks Continue with an honest message instead of persisting `file://`. Rider fix: raw `<div>` in documents.tsx (Android crash class, Gate-A UI item) → View.
- [x] Schema/DB: `nationalIdNumber` persisted (new nullable column); `employmentType` accepted and written to `DriverServicePreference.preferredType` (upsert); affiliation creation uses the chosen type instead of the hardcoded EXCLUSIVE_INTERCITY.
- [x] `registerDriver` response gains `affiliated: boolean` + `companyName`; carrier step parses it into an honest "No Carrier Linked — you're hireable on the marketplace once verified" alert instead of silence.
- [x] Dossiers render real documents: `getDriver` swaps stored keys for 300 s presigned GETs (legacy non-http values pass through as null → "missing" placeholder). Admin verification dialog renders placeholders for legacy device URIs with a re-upload prompt.
- [x] Tests: licence-gate suite (Phase 14 file covers shared helpers); upload path is thin IO over the existing tested storage service — covered by typecheck + staging leg.

## Acceptance criteria
A fresh self-registration yields verifiable documents (presigned-rendered in operator AND admin hubs), correct contract type on affiliation + marketplace surfaces, and truthful affiliation status end-to-end.
