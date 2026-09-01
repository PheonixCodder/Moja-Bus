# Complete Driver Domain Feature Matrix

This matrix catalogs all functional capabilities identified across the Moja Ride Driver Operations Domain, evaluating their implementation state, security, test coverage, and operational maturity.

| Feature Name | Primary Actor | Application | Implemented? | Complete? | Correct? | Tested? | Secure? | Observable? | Offline? | Urban? | Intercity? | Severity if Broken |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Phone OTP Driver Auth** | Driver | `apps/driver-app` | Yes | Yes | Yes | Partial | Yes | Yes | No | Yes | Yes | P1 |
| **5-Step Mobile Registration** | Driver | `apps/driver-app` | Yes | Yes | Yes | Partial | Yes | Yes | Yes (Draft) | Yes | Yes | P1 |
| **Doc Upload to Private S3** | Driver/Operator| Mobile/Web | Yes | Yes | Yes | Yes | Yes | Yes | No | Yes | Yes | P0 |
| **Operator Roster Creation** | Operator | `apps/web` | Yes | Yes | Yes | Yes | Yes | Yes | No | Yes | Yes | P1 |
| **Binding Conflict Handling** | Operator | `apps/web` | Yes | Yes | Yes | Yes | Yes | Yes | No | Yes | Yes | P1 |
| **License Expiry Gate** | System/Operator| `apps/web` | Yes | Yes | Yes | Yes | Yes | Yes | No | Yes | Yes | P0 |
| **License Category Hierarchy** | System/Operator| `apps/web` | Yes | Yes | Yes | Yes | Yes | Yes | No | Yes | Yes | P0 |
| **Admin License Verification** | Platform Admin | `apps/web` | Yes | Yes | Yes | Yes | Yes | Yes | No | Yes | Yes | P1 |
| **Doc Presigning Namespace** | Operator/Admin | `apps/web` | Yes | Yes | Yes | Yes | Yes | Yes | No | Yes | Yes | P0 |
| **One-Active-Exclusive Rule** | Driver/Operator| `apps/web` | Yes | Yes | Yes | Yes | Yes | Yes | No | Yes | Yes | P0 |
| **Marketplace Preferences** | Driver | `apps/driver-app` | Yes | Yes | Yes | Partial | Yes | Yes | No | Yes | Yes | P2 |
| **Corridor Marketplace Search**| Operator | `apps/web` | Yes | Yes | Yes | Partial | Yes | Yes | No | Yes | Yes | P2 |
| **Admin Feature/Suspend Mkt** | Platform Admin | `apps/web` | Yes | Yes | Yes | Partial | Yes | Yes | No | Yes | Yes | P2 |
| **Structured Offer Creation** | Operator | `apps/web` | Yes | Yes | Yes | Partial | Yes | Yes | No | Yes | Yes | P1 |
| **6-Round Counter Negotiation**| Driver/Operator| Mobile/Web | Yes | Yes | Yes | Partial | Yes | Yes | No | Yes | Yes | P1 |
| **7-Day Rolling Offer Expiry** | System Cron | `apps/web` | Yes | Yes | Yes | Partial | Yes | Yes | No | Yes | Yes | P2 |
| **Double-Booking Engine** | System/Operator| `apps/web` | Yes | Yes | Yes | Yes | Yes | Yes | No | Yes | Yes | P0 |
| **45min Turnaround Buffer** | System/Operator| `apps/web` | Yes | Yes | Yes | Yes | Yes | Yes | No | Yes | Yes | P0 |
| **Urgent Dispatch Modal (<2h)**| Driver | `apps/driver-app` | Yes | Partial | No (Skew) | Partial | Yes | Yes | No | Yes | Yes | P0 |
| **Urgent Server-Side Ack** | Driver | `apps/driver-app` | Yes | Yes | Yes | Partial | Yes | Yes | No | Yes | Yes | P1 |
| **Relief Driver Assignment** | Operator | `apps/web` | Yes | Yes | Yes | Partial | Yes | Yes | No | No | Yes | P1 |
| **Relief Handover Execution** | Driver | `apps/driver-app` | No | No | No | No | N/A | N/A | No | No | Yes | P0 |
| **Conductor Assignment** | Operator | `apps/web` | Yes | Yes | Yes | Partial | Yes | Yes | No | Yes | Yes | P2 |
| **Conductor Pre-Boarding** | Conductor | `apps/driver-app` | No | No | No | No | N/A | N/A | No | Yes | Yes | P0 |
| **Duty Shift Clock-In/Out** | Driver | `apps/driver-app` | Yes | Yes | Yes | Partial | Yes | Yes | No | Yes | Yes | P1 |
| **Live Shift Wage Accrual** | Driver | `apps/driver-app` | Yes | Yes | Yes | Partial | Yes | Yes | No | Yes | Yes | P2 |
| **Run-State Anti-Strand** | System/Operator| `apps/web` | Yes | Yes | Yes | Yes | Yes | Yes | No | Yes | Yes | P0 |
| **Background GPS Tracking** | Driver | `apps/driver-app` | Yes | Yes | Yes | Partial | Yes | Yes | Yes (Local) | Yes | Yes | P0 |
| **Stateless HMAC Telemetry** | Driver/Server | Mobile/Web | Yes | Yes | Yes | Yes | Yes | Yes | No | Yes | Yes | P0 |
| **Haversine Jump Gate (220k)**| Server Ingest | `apps/web` | Yes | Yes | Yes | Yes | Yes | Yes | No | Yes | Yes | P0 |
| **Telemetry Row-Lock Scaling**| Server Ingest | `apps/web` | Yes | Partial | No (Storm) | Partial | Yes | Yes | No | Yes | Yes | P0 |
| **Redis Real-Time Pub/Sub** | System | `apps/web` | Yes | Yes | Yes | Partial | Yes | Yes | No | Yes | Yes | P1 |
| **Safety Score Algorithm** | System/Cron | `apps/web` | Yes | Yes | Yes | Yes | Yes | Yes | No | Yes | Yes | P1 |
| **Marketplace Trust Badges** | System | Mobile/Web | Yes | Yes | Yes | Partial | Yes | Yes | No | Yes | Yes | P3 |
| **Nightly License Expiry Cron**| System Cron | `apps/web` | Yes | Yes | Yes | Partial | Yes | Yes | No | Yes | Yes | P1 |
| **Nightly Stats Reconcile Cron**| System Cron | `apps/web` | Yes | Yes | Yes | Partial | Yes | Yes | No | Yes | Yes | P1 |
| **180-Day Telemetry Prune Cron**| System Cron | `apps/web` | Yes | Yes | Yes | Partial | Yes | Yes | No | Yes | Yes | P2 |
| **QR Camera Ticket Scanner** | Crew | `apps/driver-app` | Yes | Yes | Yes | Partial | Yes | Yes | Yes | Yes | Yes | P0 |
| **Token Preprocessor** | Crew/Server | Mobile/Web | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | P1 |
| **Offline Scan Queue** | Crew | `apps/driver-app` | Yes | Yes | Yes | Partial | Yes | Yes | Yes | Yes | Yes | P1 |
| **Batch Sync Check-Ins** | Crew | Mobile/Web | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | P1 |
| **Passenger Manifest View** | Crew | `apps/driver-app` | Yes | Yes | Yes | Partial | Yes | Yes | No | Yes | Yes | P1 |
| **Manual Passenger Boarding** | Crew | `apps/driver-app` | Yes | Yes | Yes | Partial | Yes | Yes | No | Yes | Yes | P1 |
| **In-Flight Delay Reporting** | Driver | `apps/driver-app` | Yes | Yes | Yes | Partial | Yes | Yes | No | Yes | Yes | P2 |
| **Delay Conflict Revalidation**| System | `apps/web` | Yes | Yes | Yes | Partial | Yes | Yes | No | Yes | Yes | P1 |
| **Transactional Outbox Notices**| System/Novu | `apps/web` | Yes | Yes | Yes | Partial | Yes | Yes | No | Yes | Yes | P1 |
| **Recipient-Scoped Outbox Keys**| System | `apps/web` | Yes | Yes | Yes | Yes | Yes | Yes | No | Yes | Yes | P1 |
| **Mapbox Polyline Caching** | Driver | `apps/driver-app` | Yes | Yes | Yes | Partial | Yes | Yes | Yes | Yes | Yes | P2 |
