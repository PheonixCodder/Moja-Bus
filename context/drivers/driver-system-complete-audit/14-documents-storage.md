# 14 — Documents & Storage (driver compliance dossiers)

> Audit date: 2026-08-26 · Sources: `apps/web/lib/storage/purposes.ts`, `drivers.ts` presign blocks, admin dossier dialog, driver-app upload lib, add-driver modal.

## 1. The four private purposes (Phase 15 F-DV-05)

| Purpose | Key pattern | Limits |
|---|---|---|
| `driver-license-front` | `documents/drivers/{userId}/license-front/{uuid}-{safeName}` | ≤10 MB, image/* + pdf, maxDim 1600 q0.85, versions kept, private |
| `driver-license-back` | `documents/drivers/{userId}/license-back/…` | same |
| `driver-selfie` | `documents/drivers/{userId}/selfie/…` | ≤5 MB image only, maxDim 512 |
| `driver-medical-doc` | `documents/drivers/{userId}/medical/…` | ≤10 MB, image/* + pdf |

All `visibility: private`, IAM scope `passenger` (enforces `ctx.user.id` namespace) — deliberately so uploads work BEFORE any DriverProfile or affiliation exists. Storage = Cloudflare R2 via the S3-compatible pipeline (`lib/storage/s3.ts`, presigned PUT/GET; cdn allow-list for public assets only).

## 2. Who uploads what (the user's question: drivers OR operators)

- **Drivers** (self-wizard): selfie, licence front+back, medical doc — camera capture → presign → PUT → object key into `registerDriver`. Failed upload blocks Continue; legacy `file://` URIs from pre-pipeline registrations render as "missing / ask driver to re-upload" placeholders.
- **Operators** (add-driver modal): licence front+back ONLY — uploaded through THE SAME purposes under the OPERATOR's user namespace (recorded ruling: keys land in uploader namespace; dossier rendering is reader-agnostic because reads presign server-side by stored key). No operator UI for medical docs.
- **No post-onboarding replacement flow** on either side beyond wizard re-run/updateDriver API capability (no UI).

## 3. Read path (presign-at-render)

Both `drivers.getDriver` and `admin.listDriversForVerification` swap stored `documents/…` keys for short-lived presigned GETs at read time (`presignDoc` helpers; failures degrade to null ⇒ placeholder, never blocking). Legacy http(s)/file URIs pass through untouched. Admin dossier renders https-only images (`renderableDoc` guard); operator passport renders NOTHING yet (gap documented in 04).

## 4. Access-control posture

- Object keys are private; the ONLY read path is server-minted presigned GETs embedded in verification dossiers for permission-gated callers (operators scoped to active roster; admins to `drivers:verify.read`). No public URLs exist for compliance docs.
- Contrast with CompanyDocument system (operator company docs): that has its own versioning/supersession model; driver docs are simpler key-on-profile fields with `keepVersions: true` at storage level but no DB version chain (old key overwritten by updateDriver loses history pointer — storage object persists, DB reference doesn't).

## 5. Gaps

1. Operator passport lacks document rendering despite presigned payloads (04-module headline gap).
2. No medical-doc preview tile in admin dialog.
3. No document expiry tracking per doc (licence expiry IS tracked as a profile field; medical clearance date exists but nothing enforces freshness windows).
4. No DB-level version history when a doc URL is replaced (storage keeps objects; references don't).
5. Selfie purpose exists and wizard captures it, but it lands in `user.image`; no moderation hook.
