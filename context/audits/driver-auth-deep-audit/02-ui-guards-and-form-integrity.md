# 02. UI Guards, Form Integrity, & Client State Audit

This module documents all UI guards, client-side state behaviors, navigation edge cases, and input validation vulnerabilities across the driver mobile registration wizard.

---

## 1. Step-by-Step Wizard UI Guard Audit

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               DRIVER REGISTRATION WIZARD PAGES                                  │
├─────────────────────┬───────────────────────────┬───────────────────────────────────────────────┤
│ Wizard Screen       │ Source File               │ Primary Responsibility                        │
├─────────────────────┼───────────────────────────┼───────────────────────────────────────────────┤
│ Step 1 (Identity)   │ app/(auth)/register/index.tsx    │ Name, phone, experience, face selfie capture   │
│ Step 2 (License)    │ app/(auth)/register/license.tsx  │ License #, category, expiry, recto/verso S3   │
│ Step 3 (Legal Docs) │ app/(auth)/register/documents.tsx│ CNI #, Medical certificate photo S3 upload     │
│ Step 4 (Affiliation)│ app/(auth)/register/carrier.tsx  │ Work mode, carrier invite code, tRPC submit   │
│ Step 5 (Status)     │ app/(auth)/register/status.tsx   │ Verification status polling & resolution      │
└─────────────────────┴───────────────────────────┴───────────────────────────────────────────────┘
```

---

## 2. Critical UI & State Vulnerabilities

### Finding 1: Local `file://` URI Leakage on Selfie Capture (Step 1)

In [`apps/driver-app/app/(auth)/register/index.tsx`](file:///C:/dev/moja-buss/apps/driver-app/app/%28auth%29/register/index.tsx#L48-L65):
```ts
const handleTakeSelfie = async () => {
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (!result.canceled && result.assets?.[0]?.uri) {
    // ⚠️ STORES LOCAL FILE URI WITHOUT PRESIGNING OR S3 UPLOAD
    setSelfieUri(result.assets[0].uri);
  }
};
```
When the user submits in Step 4 ([`carrier.tsx`](file:///C:/dev/moja-buss/apps/driver-app/app/%28auth%29/register/carrier.tsx#L81)):
```ts
selfieUrl: store.profileSelfieUri || undefined, // e.g. "file:///data/user/0/.../cache/ImagePicker/selfie.jpg"
```
The server saves this local path directly into `User.image`. As a result:
- The image is completely inaccessible on any other device or browser.
- Operator and Admin verification dashboards render broken images or fallback icons for self-registered drivers.

---

### Finding 2: Missing Wizard Prerequisite Guards (Step Skipping)

In Steps 2, 3, and 4, there are **no route-level precondition checks**.
If a user directly opens or refreshes [`carrier.tsx`](file:///C:/dev/moja-buss/apps/driver-app/app/%28auth%29/register/carrier.tsx) when the in-memory store is empty:
- `store.fullName` is `""`
- `store.phone` is `""`
- `store.licenseNumber` is `""`
- `store.licenseExpiryDate` produces `Invalid Date`

Clicking *"Soumettre mon dossier officiel"* fires `trpc.drivers.registerDriver` with empty fields. The request fails with a server Zod validation error (`fullName is required`, `phone is required`), displaying an unhelpful generic error alert:
```
Erreur d'inscription: Failed to parse input
```

---

### Finding 3: In-Memory Zustand Store Volatility

In [`apps/driver-app/stores/driver-registration.ts`](file:///C:/dev/moja-buss/apps/driver-app/stores/driver-registration.ts#L52-L58):
```ts
export const useDriverRegistrationStore = create<DriverRegistrationState>((set) => ({
  ...initialState,
  updateData: (data) => set((state) => ({ ...state, ...data })),
  reset: () => set(initialState),
}));
```
The store is **strictly in-memory** and does not use Zustand's `persist` middleware with `AsyncStorage` or `SecureStore`.
- If the driver switches apps (e.g. to copy their CNI number or answer a call) while on Step 3, the Android OS may evict the app process from RAM.
- When the driver returns, all previously captured photos, presigned S3 keys, and form inputs are completely wiped, forcing the driver to restart from Step 1.

---

### Finding 4: Phone Number Discrepancy without Inline Challenge

In Step 1 ([`index.tsx`](file:///C:/dev/moja-buss/apps/driver-app/app/%28auth%29/register/index.tsx#L42-L44)), the phone input field defaults to the session phone number but is fully editable:
```ts
const [phoneInput, setPhoneInput] = useState(
  phone || (session?.user as any)?.phoneNumber || ""
);
```
- If the driver edits this phone number to a different number, Step 1 allows them to proceed to Step 2, Step 3, and Step 4.
- Only when they finally press *Submit* on Step 4 does the server throw `PHONE_REVERIFICATION_REQUIRED`.
- **UI Flaw**: The user spends 5–10 minutes taking photos and filling documents only to be blocked at the final submission step because the phone number was changed in Step 1 without an inline OTP re-verification.

---

### Finding 5: Date Input Format Fragility

In Step 2 ([`license.tsx`](file:///C:/dev/moja-buss/apps/driver-app/app/%28auth%29/register/license.tsx#L217-L223)):
```ts
<Input
  label="Date d'expiration"
  placeholder="AAAA-MM-JJ (ex: 2028-12-31)"
  value={expiryInput}
  onChangeText={setExpiryInput}
/>
```
The expiration date is collected via a standard text input with no native date picker, mask, or format validation on the client. If a driver inputs `31/12/2028` or `2028/12/31`:
- `new Date(store.licenseExpiryDate)` produces `Invalid Date` or wrong timestamp.
- Server rejects the payload or records an incorrect expiry timestamp.

---

## 3. UI Guard Verification Checklist

| UI Guard / Verification | Status | Severity | Notes |
| :--- | :--- | :--- | :--- |
| **Selfie Upload to S3** | ❌ FAILED | P1 | Local `file://` URI stored directly. |
| **Wizard Step Route Guards** | ❌ FAILED | P2 | Users can land on Step 4 with empty store. |
| **Form State Persistence** | ❌ FAILED | P2 | In-memory store wiped on process eviction. |
| **Inline Phone Normalization** | ❌ FAILED | P2 | Phone mismatch rejected only at Step 4. |
| **Date Input Picker / Mask** | ❌ FAILED | P3 | Freeform text input allows invalid date syntax. |
| **Camera Permission Denial Recovery**| ⚠️ PARTIAL | P3 | Alerts user, but provides no deep-link to Settings. |
| **Document Upload Retry UX** | ✅ PASSED | — | Step 2 & 3 prompt user if S3 upload fails. |
| **Haptic Feedback & Sound** | ✅ PASSED | — | Uses `DriverFeedback` on all interactions. |
