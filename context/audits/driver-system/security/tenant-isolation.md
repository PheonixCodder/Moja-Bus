# Security Audit: Multi-Tenant Operator Isolation

## 1. Multi-Tenant Isolation Controls

Audits:
1. Operator company scoping: `where: { companyId: ctx.companyId }`.
2. Cross-company double-booking conflict detection.
3. Affiliation privacy.

---

## 2. Isolation Evaluation

* **Roster Queries**: Fully isolated. Operators can only query drivers who hold an active or historical affiliation with their company (`DriverCompanyAffiliation.companyId === ctx.companyId`).
* **Live Fleet Positions**: Fully isolated. `drivers.getLivePositions` filters strictly by the requesting operator's `companyId`.
* **Double-Booking Engine**: Cross-company conflict detection reveals *that* a driver is busy on another operator's route, but masks passenger counts and revenue terms, preserving commercial privacy.
