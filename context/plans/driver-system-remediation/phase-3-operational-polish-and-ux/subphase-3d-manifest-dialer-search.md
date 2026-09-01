# Subphase 3D: Manifest Native Phone Dialer & Search Refinements

## 1. Problem Statement & Findings Addressed

* **Finding Addressed**: `DRV-P2-15 (Manifest Passenger Search & Phone Dialer Ergonomics)`.
* **Current Defect**: Passenger phone numbers on the manifest are static non-clickable text, and the search bar only filters by passenger name (omitting phone numbers and seat labels).

---

## 2. Architecture & Scope of Changes

1. Wrap phone numbers in `TouchableOpacity` that invokes `Linking.openURL('tel:${phone}')`.
2. Expand client-side search filter in `manifest-view.tsx` to match against `fullName`, `phoneNumber`, and `seatNumber`.

---

## 3. Implementation Steps & File Checklist

- [ ] Update `apps/driver-app/features/trips/screens/manifest-view.tsx`.
- [ ] Add phone icon button next to passenger name that triggers native device dialer.
- [ ] Update `useMemo` search filter:
  ```typescript
  const filtered = passengers.filter(p => 
    p.fullName.toLowerCase().includes(q) ||
    p.phoneNumber?.includes(q) ||
    p.seatNumber?.toLowerCase().includes(q)
  );
  ```

---

## 4. Verification & Testing Criteria

* [ ] Tap phone icon next to passenger name. Verify device launches native dialer with prefilled number.
* [ ] Enter seat number "14B" in search bar. Verify list filters down to seat 14B passenger.
