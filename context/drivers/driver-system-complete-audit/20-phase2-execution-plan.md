# 20 — Phase 2 Execution Plan (Verification Truth)

> ✅ **EXECUTED 2026-08-26.** Gates: web tsc **exit 0** · web suite **579/579** (incl. 9 new driver-doc-access tests) · biome clean on all NEW files; modified routers carry only their pre-existing `noExplicitAny` idiom.
> Implementation notes vs plan: pure contracts split from minting (`driver-doc-access.ts` is server-only-free so tsx tests can load it; `driver-doc-mint.ts` holds the storage side-effect) after `@/lib/storage`'s `server-only` guard detonated under tsx. admin.ts imports the lib modules directly (the drafted cross-router re-export never existed).

> Rulings locked 2026-08-26 (user-approved): **D1=A** on-demand presigning · **D3=C** operator-now/driver-later · **D3b=audit-log-only** · **D6=defer i18n to micro-phase next**. Open ruling: **D8** (wizard selfie bug) — recommended B, see bottom.

## Locked architecture

Documents render through ONE path: `<DriverDocPreview>` mints a fresh 5-min URL on demand via `drivers.presignDoc` (domain-owned; see R2). Query responses carry raw stored keys only (de-presigned). No baked-in URLs survive anywhere.

---

## Adversarial re-test corrections (2026-08-26, second pass)

- **R1 🔴 (hole):** the operator's `VerifyDriverDialog` — the ACTUAL approval moment — showed no documents (only a static checklist). New **T3b** embeds the preview trio in that dialog. Without it the phase claimed victory while the primary approval path stayed blind.
- **R2 (domain placement):** presign procedure moves OUT of `storage.ts` into `drivers.presignDoc` (drivers.ts) — driver tenancy belongs in the driver router; storage router stays single-purpose for company documents.
- **R3 (least surface):** `driver-selfie` excluded from the presignable set while D8=B stands (zero producers).
- **R4 (atomicity):** T6's profile-update + ActivityLog row run in ONE `$transaction`.
- **R5 (isolation):** per-doc minting kept deliberately — a failing PDF mint never blocks image tiles.

## Tasks (execution order)

### T1 ✅ — Router: `drivers.presignDoc` (domain-owned presigning)
`apps/web/trpc/routers/drivers.ts` — new operatorCompanyProcedure (+ admin twin handling, see below).
- Input: `{ driverProfileId, docType: "driver-license-front"|"driver-license-back"|"driver-medical-doc", objectKey }`.
- Authorization: load driver + user. OPERATOR caller requires an ACTIVE affiliation between ctx.companyId and the driver (mirrors getDriver scoping; `requirePermission(ctx,"drivers:read")`). ADMIN-role callers (adminProcedure equivalent) allowed unconditionally — mirror admin.getDriver reach.
- Namespace guard (the enterprise bit): requested `objectKey` MUST start with `documents/drivers/${driver.userId}/` — authorizing the *driver*, not trusting the key, prevents this endpoint becoming a generic presigner for arbitrary objects.
- Mint via existing `createPresignedDownload` (300 s TTL unchanged). `driver-selfie` EXCLUDED until D8 resolves (R3).
- Tests: cross-company operator FORBIDDEN · non-affiliated NOT_FOUND · foreign-namespace key FORBIDDEN · admin OK · unknown docType rejected.

### T2 ✅ — Shared `<DriverDocPreview>` component
New: `apps/web/features/driver/components/driver-doc-preview.tsx` (domain-owned; cross-feature import precedent = route-map-preview).
- Props: `{ driverProfileId, docType, objectKey: string|null, label }`.
- Legacy passthrough: value starting `http(s)://` renders directly (pre-pipeline rows); `file://` or null → "missing / ask driver to re-upload" placeholder.
- States: minting spinner → image (`<img>`) | PDF (extension-detect → inline `<object>`) → always an "Open full document" anchor; error state with Retry re-mints.
- Consumes T1 via `useMutation(drivers.presignDoc)` per doc on demand — fresh URL per view, expiry landmine gone; per-doc isolation (R5).

### T3 ✅ — Passport Credentials-tab inspector *(gap #2 closed)*
`driver-detail-view.tsx`: three `DriverDocPreview` instances (licence front/back/medical) under the existing licence-info card.

### T3b ✅ — Documents inside the operator VerifyDriverDialog *(R1 — the approval moment itself)*
Also gained the F-OP-16 client mirror: Approve disables until ≥1 compliance doc exists on the fetched dossier.
`verify-driver-dialog.tsx`: on open, fetch the driver (getDriver) and render the same preview trio ABOVE Approve/Reject. The dialog currently receives only `{id,name,licenseNumber}` from the roster row; it becomes self-sufficient so the decision point carries its own evidence. Admin dialog already gets this via T4 — after T3b both approval surfaces see documents at the moment of decision.

### T4 ✅ — Admin dossier retrofit *(gaps #13 + F1/F3)*
`driver-verification-dialog.tsx`: replace both baked-URL tiles with three `DriverDocPreview` tiles, grid → `md:grid-cols-3`. Approve-gate disabled-state switches from presigned-URL presence to RAW key presence (pairs with T7).

### T5 ✅ — Verifications queue pagination + debounce *(gap #4 + F6)*
`admin-driver-verifications-view.tsx`: offset state + accumulating Load-more (dedup by id, reset on filter change — roster pattern); `useDebounce(search, 300)`. Server API unchanged (limit/offset exist).

### T6 ✅ — Operator document replacement *(gap #14, D3/C)*
`driver-roster-actions.tsx` Edit dialog: three optional file inputs using the add-modal's presign→PUT→key flow; new keys sent through existing `updateDriver` fields (server-ready via `driverDocReferenceSchema`).
Server side (`drivers.updateDriver`): when any doc field changes, write an ActivityLog row INSIDE the SAME `$transaction` as the update (R4) — `{companyId, userId: ctx.user.id, action: "DRIVER_DOCS_REPLACED", description, metadata: {driverProfileId, replacedDocTypes}, targetUserId}`. Status untouched per D3b.

### T7 ✅ — De-presign the two producer queries
`drivers.getDriver` + `admin.listDriversForVerification`: drop their `presignDoc` blocks; return raw stored values (response shape otherwise stable; both consumers migrated by T3/T4). Kills up to 150 signings per keystroke-fetch.

### T8 ✅ (automated half) — Gates
tsc 0 · suite 579/579 · biome clean-new. **Manual E2E matrix still pending staging**: operator views 3 docs · admin views docs incl. a PDF · queue reachable past 50 · tab-away-and-back shows no broken images · doc replacement logs + survives refetch · legacy `file://` rows show placeholders.
web tsc clean · full web suite green · biome clean on touched files. Manual: operator views all 3 docs; admin views docs incl. a PDF; queue reachable past 50; tab-away-and-back shows NO broken images; doc replacement logs + survives refetch; legacy `file://` rows show placeholders.

---

## Residual risks & honest shortcomings (accepted, with tripwires)

1. **Post-verification doc swaps** are visible only via ActivityLog until an admin "docs replaced since verification" view exists. Tripwire: build it if platform-abuse patterns ever appear; admin SUSPEND remains the immediate remedy today.
2. **Manual visual review stays human-dependent** — no document-authenticity validation (MRZ etc.). Ceiling on what "verified" means in v1; matches CIV-market reality.
3. **Interim mixed language**: T2/T3b/T4/T6 introduce some hardcoded English UI strings; the post-P2 i18n micro-phase MUST absorb them (recorded there).
4. **Latency cost of freshness**: ~3 mint round-trips per dossier view (~300–500 ms). Bought deliberately for isolation and always-valid URLs.
5. **Two presign doors exist** after R2 (storage.presignDownload for company docs, drivers.presignDoc for driver docs) — deliberate domain separation, not drift; documented here to prevent future "unification" churn.

## Out of scope (explicit)
Trip-History tab (#9→P4) · employment-type guards (#3→P3) · i18n sweep (#18 → immediate post-P2 micro-phase, D6) · driver self-service doc screen (#D3 → added to P7) · any schema migration.

## D8 — open ruling: wizard selfie bug (found during exploration)
`register/carrier.tsx:58` submits the LOCAL camera URI as `selfieUrl`; nothing ever calls the `driver-selfie` upload purpose; `registerDriver` writes the `file://` string into `user.image`. Harmless visually (avatars fall back to initials) but it is dead/garbage data, and the captured identity photo is lost.
- **B (recommended):** document as gap #27, fix lands with Phase 7's identity-passport work (proper home: decide public-avatar vs private-dossier-photo then). Zero Phase-2 scope creep.
- **A:** fix now — upload via existing helper + nullable `selfieDocUrl` column (migration) + dossier tile. Costs Phase 2 its "no migrations" property.
