# Workflow Audit: Marketplace Employment Offers

## 1. Offer Creation & Delivery

Audits:
1. Marketplace listing search: `drivers.listMarketplaceDrivers`.
2. Offer submission: `drivers.sendEmploymentOffer`.
3. Delivery notification: `enqueueDriverOfferReceived`.

---

## 2. Identified Offer Defects

### 2.1 Missing License-Class Gate on Exclusive Intercity Offers
* **Location**: `apps/web/features/operator/components/drivers/send-offer-dialog.tsx#L155-L167`.
* **Issue**: The UI displays a soft warning if a driver holds Class B/C when sending an `EXCLUSIVE_INTERCITY` offer, but the backend `drivers.sendEmploymentOffer` procedure does **not** hard-block the offer creation. An operator can successfully contract a Class B driver for exclusive intercity routes, who will subsequently be blocked when assigned to trips.
* **Fix**: Enforce server-side check in `sendEmploymentOffer`: reject `EXCLUSIVE_INTERCITY` offers for sub-D license holders.
