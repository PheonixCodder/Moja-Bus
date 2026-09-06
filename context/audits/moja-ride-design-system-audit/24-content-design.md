# Moja Ride Design & Design-Engineering Audit
## 24. Content Design & Terminology Parity

### 1. Terminology Consistency & Conceptual Drift

Content design is as vital as visual design. When a platform uses multiple conflicting terms for the same conceptual entity, users suffer cognitive fatigue and disorientation.

#### Terminology Drift Across Moja Ride:

| Concept | Primary Term | Detected Synonyms in Repo | Evaluation |
| :--- | :--- | :--- | :--- |
| **Bus Journey** | **Trip** | "Journey", "Ride", "Trajet", "Voyage" | In French locales, `trajet` and `voyage` are used interchangeably without distinguishing between a scheduled line (`trajet`) and a specific instance (`départ`/`voyage`). |
| **User Booking** | **Booking** | "Reservation", "Ticket", "Billet", "Commande" | In English, "Booking" and "Reservation" alternate in table headers. |
| **Transport Provider**| **Operator** | "Company", "Compagnie", "Transporteur", "Carrier" | Schema uses `Company`, frontend views alternate between `Operator` and `Company`. |
| **Vehicle Pilot** | **Driver** | "Chauffeur", "Conducteur" | In driver-app, the driver is the vehicle pilot, while the conductor is the ticket validator. However, in English translations, both are occasionally labeled "Driver". |

---

### 2. Localization Parity (French & English)

Moja Ride serves primarily Côte d'Ivoire (French official language) with English support:
- `apps/web`: Powered by `next-intl` (`en.json` and `fr.json`).
- `apps/traveler-app`: Powered by `i18next` with `i18n-parity.test.ts`.
- `apps/driver-app`: Powered by `i18next` with `i18n-parity.test.ts`.

#### Content Parity Strengths:
The repository contains automated parity tests (`__tests__/i18n-parity.test.ts`) ensuring that translation keys present in English exist in French.

#### Critical Content Design Defects:
1. **French Locale Leakage in English UI**:
   - As documented in `22-filters-search-url-state.md`, date formatters hardcode `{ locale: fr }`, forcing French month abbreviations (`févr.`, `avr.`, `août`) onto English dashboard views.
2. **Missing Empty State Microcopy**:
   - In `operator-bookings-view.tsx` line 56: `{t("emptyText")}` simply says "No bookings found."
   - Lacks actionable guidance (e.g. "Try changing your date filter or search query to find bookings.").
3. **Passive Error Copy**:
   - Errors often default to raw backend exception messages (e.g. `err.message || t("toast.checkInFailed")`), occasionally displaying raw tRPC error strings like `TRPCClientError: FORBIDDEN`.

---

### 3. Content Design Guidelines for Moja Ride

1. **Lock Canonical Nomenclature**:
   - Intercity transport instance: **Trip** (`Trajet`)
   - Seat reservation transaction: **Booking** (`Réservation`)
   - Verification credential: **Ticket / Boarding Pass** (`Billet / Carte d'embarquement`)
   - Commercial bus enterprise: **Operator** (`Compagnie`)
2. **Eliminate All Hardcoded Locale Invocations**:
   - Ensure date and number formatters always consume the runtime user locale.
3. **Adopt Active, Guidance-Driven Empty States**:
   - Formula: What is empty + Why it is empty + Single actionable next step.
