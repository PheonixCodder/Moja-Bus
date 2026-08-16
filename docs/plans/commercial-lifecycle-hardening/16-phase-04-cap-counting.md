# Phase 04 — Cap counting choice

**Decision:** Campaign redemption caps (`maxRedemptionsGlobal` / per-user / per-phone) count **FINALIZED** redemptions only for eligibility. Campaign **budget** continues to use `budgetConsumedXOF + budgetReservedXOF` with conditional SQL on freeze.

**Rationale:**
- Reserved holds expire and release budget/coupon counters; counting RESERVED toward "used" caps over-penalized inventory during the hold window.
- Budget oversell is the money-critical race — guarded by `UPDATE … WHERE consumed+reserved+amount <= budget` under `FOR UPDATE`.
- Coupon `redemptionCount` still increments on reserve (with conditional `count < max`) so concurrent coupon freezes cannot exceed max.

**Hold TTL:** Expired holds call `releaseDiscountReservations`, which decrements reserved budget and coupon redemptionCount.
