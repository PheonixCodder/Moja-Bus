# Phase 4: Operator Dashboard Dispatch & Staff

> **File**: `context/plans/unified-driver-conductor-system/04-operator-dashboard-dispatch-and-staff.md`  
> **Target Views**: `apps/web/features/operator/views/operator-staff-view.tsx`, Operator Trip Dispatch Dialog  
> **Status**: Ready for Implementation  

---

## 1. Objectives

1. Verify and highlight `CONDUCTOR` (Convoyeur / Contrôleur) in the Operator Staff invitation workflow.
2. Upgrade the Trip Dispatch Dialog to display three distinct, clear assignment selectors:
   - **Chauffeur principal (Primary Driver)**: Single required/optional selector pulling from active company drivers.
   - **Chauffeur de relais (Relief Driver)**: Optional backup selector pulling from active company drivers.
   - **Convoyeur (Conductor)**: Optional boarding staff selector pulling from company staff with role `CONDUCTOR`.

---

## 2. Staff System Verification (`apps/web/features/operator/views/operator-staff-view.tsx`)

In `packages/schemas/src/permissions.ts`:
- `STAFF_ROLES` includes `"CONDUCTOR"`.
- `INVITABLE_STAFF_ROLES` includes `"CONDUCTOR"`.
- Default template:
  ```typescript
  CONDUCTOR: [
    "routes:read",
    "trips:read",
    "bookings:read",
    "bookings:update",
    "bookings:checkin",
    "reviews:read",
  ]
  ```

In `InviteSheet.tsx` (or role selection component):
- Label: *"Convoyeur / Contrôleur de bord"*
- Description: *"Gère l'embarquement, la vérification des billets et l'accès au manifeste passagers."*

---

## 3. Trip Dispatch Dialog Layout

Replace the confusing single dropdown with a structured 2-section panel:

```
┌─────────────────────────────────────────────────────────────┐
│ Affectation de l'équipage                                   │
├─────────────────────────────────────────────────────────────┤
│ 🚗 CONDUCTEURS DU VÉHICULE (Chauffeurs vérifiés)            │
│                                                             │
│ Chauffeur principal *                                       │
│ [ Sélectionner un chauffeur dans la flotte...         ▼ ]   │
│                                                             │
│ Chauffeur de relais (Optionnel)                             │
│ [ Sélectionner un chauffeur de remplacement...        ▼ ]   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 🎫 PERSONNEL DE BORD (Personnel de l'entreprise)            │
│                                                             │
│ Convoyeur / Contrôleur (Optionnel)                          │
│ [ Sélectionner un convoyeur de l'équipe...             ▼ ]   │
│                                                             │
│ [ Annuler ]                                 [ Enregistrer ] │
└─────────────────────────────────────────────────────────────┘
```

### Mutation Wiring:
- Selecting Primary Driver calls: `trpc.trips.assignDriver.mutate({ tripId, driverProfileId, role: "PRIMARY" })`
- Selecting Relief Driver calls: `trpc.trips.assignDriver.mutate({ tripId, driverProfileId, role: "RELIEF" })`
- Selecting Conductor calls: `trpc.trips.assignConductor.mutate({ tripId, staffId })`
