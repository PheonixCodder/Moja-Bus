# Engineering Audit: Third-Party Integrations

## 1. External Integrations Catalog

The Driver Operations Domain integrates with:
1. **Better Auth**: Phone OTP & Session management.
2. **Novu Notification Engine**: Push and in-app notifications.
3. **Mapbox Directions API**: Turn-by-turn route coordinates and distance estimates.
4. **AWS S3 / Cloudflare R2**: Private compliance document storage.

---

## 2. Integration Failure Modes & Risks

### 2.1 Mapbox Rate Limiting on High Concurrency
* **Location**: `apps/driver-app/lib/mapbox.ts`.
* **Problem**: Each trip start makes a direct client-side request to Mapbox Directions API without server caching. Under fleet-wide departure surges (e.g. 06:00 AM departures), Mapbox rate limits can be exceeded, causing route lines to render as straight lines (`isApproximate: true`).
* **Fix**: Generate and cache Mapbox route geometry on the backend during Route creation; have the mobile client fetch the pre-computed route geometry from the trip payload.

### 2.2 S3 Bucket Regional Latency
* **Location**: `apps/web/features/driver/lib/driver-doc-mint.ts`.
* **Problem**: Presigned upload URLs target a single AWS region (e.g. `eu-west-1`), which can exhibit high latency from Abidjan during document upload.
* **Recommendation**: Enable S3 Transfer Acceleration or Cloudflare R2 multi-region edge endpoints.
