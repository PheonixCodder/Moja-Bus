# 03. Driver Verification, Governance, & Document Security Audit

This module analyzes the regulatory verification, KYC approval, and document security architecture across the Operator ERP and Platform Admin portals.

---

## 1. Verification Authority Matrix

The Moja Ride platform implements a **dual-tiered verification architecture**:

```
                               ┌────────────────────────────────┐
                               │   Driver Submits Credentials   │
                               │  (DriverProfile: PENDING)      │
                               └───────────────┬────────────────┘
                                               │
                       ┌───────────────────────┴───────────────────────┐
                       ▼                                               ▼
     ┌──────────────────────────────────┐            ┌──────────────────────────────────┐
     │      OPERATOR VERIFICATION       │            │       ADMIN VERIFICATION         │
     │   (Fleet Level: verifyDriver)    │            │  (Platform Level: admin.verify)  │
     ├──────────────────────────────────┤            ├──────────────────────────────────┤
     │ • Scoped strictly to company     │            │ • Platform-wide regulatory check │
     │ • Approves driver for company    │            │ • Controls marketplace & dispatches│
     │ • Checks license expiry & docs   │            │ • Can APPROVE / REJECT / SUSPEND │
     │ • Requires drivers:verify.manage │            │ • Dispatches Novu outcome notice │
     └──────────────────────────────────┘            └──────────────────────────────────┘
```

---

## 2. Operator Fleet Verification ([`verify-driver-dialog.tsx`](file:///C:/dev/moja-buss/apps/web/features/operator/components/drivers/verify-driver-dialog.tsx))

### Workflow & Invariants:

1. **Company Tenancy Scoping**:
   - The operator procedure validates that the driver is actively affiliated with `ctx.companyId`:
     ```ts
     const affiliation = await ctx.prisma.driverCompanyAffiliation.findFirst({
       where: { driverProfileId: input.id, companyId: ctx.companyId, isActive: true },
     });
     if (!affiliation) throw new TRPCError({ code: "FORBIDDEN", message: "Driver not affiliated with your company." });
     ```
2. **Mandatory Evidence Gate (Anti-Rubberstamping)**:
   - The approval button is disabled unless at least one verified compliance document is attached:
     ```ts
     const hasComplianceDoc = !!(dossier?.licenseFrontUrl || dossier?.licenseBackUrl || dossier?.medicalDocUrl);
     <Button disabled={verifyMutation.isPending || !hasComplianceDoc}>Approve & Verify</Button>
     ```
   - Prevents fleet managers from blindly verifying placeholder driver profiles without uploaded credentials.
3. **Audit Trail**:
   - Updates `verificationStatus = "VERIFIED"` or `"REJECTED"`.
   - Records `rejectionReason` in `DriverProfile`.
   - Logs `DRIVER_VERIFIED` or `DRIVER_REJECTED` in `ActivityLog`.

---

## 3. Platform Admin Verification ([`driver-verification-dialog.tsx`](file:///C:/dev/moja-buss/apps/web/features/admin/components/drivers/driver-verification-dialog.tsx))

### Workflow & Governance:

1. **Permission Guard**:
   - Gated by `adminProcedure` and permission `drivers:verify.manage` (or Super Admin role).
2. **Actions Supported**:
   - `APPROVE`: Sets `verificationStatus = "VERIFIED"`, clears `rejectionReason`.
   - `REJECT`: Sets `verificationStatus = "REJECTED"`, requires non-empty `rejectionReason`.
   - `SUSPEND`: Sets `verificationStatus = "SUSPENDED"`, triggers emergency operational state teardown.
3. **Notification Integration**:
   - Fires `driver-verification-outcome` Novu workflow asynchronously to notify the driver via French email and in-app alert.
4. **Emergency Operational Teardown (`suspendDriverOperationalState`)**:
   - When an admin rejects or suspends a driver, the server executes an atomic teardown:
     1. Closes any open `DriverShift` with an automatic timestamp note.
     2. Disassociates the driver from any scheduled `TripDriverAssignment` that has not departed.
     3. Clears `currentTripId` and sets operational status to `SUSPENDED`.
     4. Blocks the driver from starting new trips or minting live telemetry tokens.

---

## 4. Document Presigning & Storage Security ([`driver-doc-mint.ts`](file:///C:/dev/moja-buss/apps/web/features/driver/lib/driver-doc-mint.ts))

To prevent public exposure of sensitive personal documents (national IDs, driver licenses, medical records), all documents are stored privately in S3 and accessed exclusively via short-lived presigned URLs.

```
[Browser Request Doc Preview] ──► trpc.drivers.presignDocUrl / trpc.admin.presignDocUrl
                                                          │
                                                          ▼
                                            mintDriverDocUrl Helper
                                                          │
                                ┌─────────────────────────┴─────────────────────────┐
                                ▼                                                   ▼
                     1. Affiliation Check                               2. Namespace Guard
                 (Operator owns driver OR Admin)                  driverDocKeyMatches(userId, type, key)
                                                                                    │
                                                                                    ▼
                                                                     3. S3 Presigned Download URL
                                                                        (TTL: 300 seconds / 5 mins)
```

### Namespace Security Guard:
```ts
export function expectedDriverDocPrefix(driverUserId: string, docType: DriverDocType): string {
  return `documents/drivers/${driverUserId}/${DRIVER_DOC_SEGMENTS[docType]}/`;
}

export function driverDocKeyMatches(driverUserId: string, docType: DriverDocType, objectKey: string): boolean {
  return objectKey.startsWith(expectedDriverDocPrefix(driverUserId, docType));
}
```

### Security Benefits Verified:
- **Zero Arbitrary Key Presigning**: Callers cannot pass arbitrary S3 object keys (e.g. system backups or invoices). The endpoint only presigns keys matching the driver's own user ID and document segment.
- **Tenant Scoping**: Operators can only mint document URLs for drivers currently in their active fleet.
