# Security Audit: Authentication & Session Integrity

## 1. Authentication Architecture

Audits:
1. Better Auth Phone OTP sign-in (`authClient.phoneNumber`).
2. Session cookies stored in `expo-secure-store`.
3. Stateless HMAC dispatch tokens for telemetry.

---

## 2. Authentication Evaluation

* **Strengths**: Stateless HMAC tokens eliminate database session overhead on telemetry ingest; phone OTP eliminates weak passwords.
* **Findings**: Inactive driver sessions do not auto-logout after prolonged inactivity, requiring manual logout when devices are decommissioned.
