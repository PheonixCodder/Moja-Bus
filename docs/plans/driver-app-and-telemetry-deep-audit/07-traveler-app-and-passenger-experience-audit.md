# 07 — Traveler App & Passenger Experience Audit

## 1. Overview of Passenger-Facing Surfaces

The Traveler App (`apps/traveler-app`) is the passenger mobile client. In relation to the Driver and Telemetry system, it provides two critical touchpoints:
1. **Real-Time Live Bus Tracking**: Live bus position, moving map marker, real-time vehicle speed, and estimated time of arrival (ETA).
2. **3-Way Multi-Criteria Review Modal**: Granular feedback prompt upon trip completion evaluating Driver, Bus, and Punctuality.

```
apps/traveler-app/
├── app/
│   ├── tracking/
│   │   └── [tripId].tsx             # Live bus tracking screen
│   └── reviews.tsx                  # Passenger reviews list
└── features/
    └── booking/
        ├── components/
        │   ├── review-sheet.tsx     # 3-way review bottom sheet modal
        │   └── review-stars.tsx     # Interactive star rating selector
        └── screens/
            └── booking-detail.tsx   # Booking detail with "Track Live Bus" CTA
```

---

## 2. Deep Dive: Live Bus Tracking Screen (`[tripId].tsx`)

Located in `apps/traveler-app/app/tracking/[tripId].tsx`:

### Visual & Interactive Elements:
- **Top Header**: Back button, animated "Live Bus Telemetry" green pulsing beacon, trip reference number.
- **Geo Canvas**: Simulated dark grid canvas with animated vehicle radar icon and moving bus pin.
- **Floating HUD Badge**:
  - Live arrival countdown: `Estimated Arrival: 28 mins`.
  - Vehicle speed: `72 km/h`.
- **Assigned Driver & Vehicle Card**:
  - Driver initials avatar, full name (`Ibrahim Touré`), verified star rating (`4.92 ★`), and completed trips count (`380+ trips`).
  - Bus registration plate badge (`9842-HJ-01`).
  - "Moja Verified Commercial Carrier" trust badge.

### Gaps & Findings:
- 🟡 **WebSocket Telemetry Subscription**: `[tripId].tsx` currently updates live speed via an internal `setInterval` simulation. It should subscribe to the WebSocket telemetry channel `trip:${tripId}:telemetry` or use a react-query polling hook to receive true vehicle coordinates.

---

## 3. Deep Dive: 3-Way Review Modal (`ReviewSheet`)

Located in `apps/traveler-app/features/booking/components/review-sheet.tsx`:

### Multi-Criteria Breakdown:
1. **Overall Experience**: 1 to 5 Stars (Hero rating).
2. **Driver Safety & Courtesy**: 1 to 5 Stars with red driver icon (`User`).
3. **Bus Cleanliness & AC**: 1 to 5 Stars with blue bus icon (`Bus`).
4. **Punctuality & Schedule**: 1 to 5 Stars with green clock icon (`Clock`).
5. **Passenger Written Note**: Multiline text area.

### Critical Blocker Bug:
- 🔴 **CRITICAL FATAL BUG (Line 76)**:
  ```tsx
  // Line 76 of apps/traveler-app/features/booking/components/review-sheet.tsx:
  <View className="flex-row items-center justify-between">
    <div>  {/* <-- HTML DIV in React Native! */}
      <Text className="text-xl font-extrabold text-foreground">
        Rate Your Journey
      </Text>
      <Text className="text-xs text-muted-foreground mt-0.5">
        Provide feedback for your driver, bus, and on-time experience.
      </Text>
    </div>
    <Pressable onPress={onClose} hitSlop={12}>
      <Text className="text-lg text-muted-foreground">✕</Text>
    </Pressable>
  </View>
  ```
  `<div>` is an invalid React Native component. Opening the review modal on iOS or Android crashes the application immediately. Must be replaced with `<View>`.

---

## 4. Passenger Web Dashboard (`apps/web/app/[locale]/dashboard/(passenger)`)

In the Next.js web application:
- Travelers can review past bookings and see assigned driver ratings.
- Active bookings display live trip departure statuses.
- Full parity with mobile review submission is maintained through the shared `submitTripReviewSchema`.
