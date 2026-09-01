# Workflow Audit: Driver ↔ Operator Affiliations

## 1. Affiliation Lifecycle & Operations

Audits:
1. Multi-tenant roster listings: `drivers.listDrivers`.
2. Driver updates: `drivers.updateDriver`.
3. Roster termination: `drivers.deleteDriverAffiliation`.

---

## 2. Identified Affiliation Defects

### 2.1 In-Flight Removal Block Ambiguity
* **Location**: `apps/web/trpc/routers/drivers.ts#L1170-L1190`.
* **Issue**: If an operator attempts to remove a driver who is currently driving for *another* company (`driver.currentTrip.companyId !== ctx.companyId`), the procedure allows deactivating the affiliation. However, this abruptly strips the driver's permissions for the removing company while they are on the road.
* **Fix**: Provide a confirmation prompt explaining that the driver is on an active run for another carrier before confirming removal.
