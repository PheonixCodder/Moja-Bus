# Engineering Audit: Operator & Admin Web Portals

## 1. Web Portal Architecture

The Operator and Admin web interfaces are built with Next.js App Router, React Server Components, TanStack Query, Radix UI primitives, and Tailwind CSS.

---

## 2. Identified Frontend Defects

### 2.1 Missing Optimistic Cache Invalidation on Offer Responses
* **Location**: `apps/web/features/operator/components/drivers/send-offer-dialog.tsx#L74-L88`.
* **Problem**: After sending an employment offer, the UI invalidates `listMarketplaceDrivers` and `listSentOffers`, but does not invalidate the driver public profile sheet query, leaving the profile sheet showing stale "Send Offer" buttons until closed and re-opened.

### 2.2 Unhandled Document Presigning Failures in Dossier Previews
* **Location**: `apps/web/features/driver/components/driver-doc-preview.tsx#L45-L65`.
* **Problem**: If private S3 presigning fails (e.g. storage credentials expire or network timeout), the preview card renders a broken image icon with no "Retry Download" action or error description.
