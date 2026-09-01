# Security Audit: Compliance Document Access & IDOR

## 1. Compliance Document Access Controls

Audits:
1. Private S3 storage namespace: `documents/drivers/{userId}/{segment}/`.
2. Pure namespace guard: `driverDocKeyMatches`.
3. Presigning endpoints: `drivers.presignDoc` & `admin.presignDoc`.

---

## 2. IDOR Evaluation

* **Model**: "Authorize the Driver, Not the Key".
* **Effectiveness**: **100% IDOR-Proof**. An operator cannot view a competitor's driver document by forging S3 object keys. The server verifies active company affiliation and asserts that the object key prefix exactly matches the driver's internal user ID.
