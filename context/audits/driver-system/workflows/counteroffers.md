# Workflow Audit: Counteroffers & Negotiation Engine

## 1. Negotiation Protocol & State Transitions

Audits:
1. Driver counter: `drivers.respondToOffer(COUNTER)`.
2. Operator counter/accept: `drivers.respondToCounterOffer`.
3. Round counting (`MAX_COUNTER_ROUNDS = 6`) and 7-day rolling expiry.

---

## 2. Identified Negotiation Defects

### 2.1 Lost Counteroffer Note on Rapid Double Counter
* **Location**: `apps/web/trpc/routers/drivers.ts#L450-L490`.
* **Issue**: If an operator submits a counteroffer note, but the driver immediately counters back before viewing the operator's note, `currentNote` is overwritten with the driver's note. While the historical note is preserved in `DriverOfferEvent`, the latest snapshot loses the operator's comments.
* **Fix**: Separate `operatorNote` and `driverNote` columns in `DriverEmploymentOffer`.
