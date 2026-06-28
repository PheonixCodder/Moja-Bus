# Build Plan

## Core Principle
All pages and views must be built as visually complete, static mock-ups with high-fidelity mock data before wiring up Firebase databases or authentication. This ensures layout, colors, animations, and typography are polished and responsive on mobile devices before logic is introduced.

---

## Development Phases

### Phase 1 — Styling Foundation & App Shell
- [ ] 01 Configure Vite project with TypeScript and Tailwind CSS
- [ ] 02 Implement global HSL warm design system tokens in CSS and Tailwind configuration
- [ ] 03 Build main App Shell (`App.tsx`, `TopHeader`, `BottomNav`) with glassmorphism blur and responsive container centering
- [ ] 04 Implement Page routing for Splash (`/`), Board (`/board`), Post (`/post/:id`), Event (`/event/:id`), Profile (`/profile`), and Notifications (`/notifications`)

### Phase 2 — Static Page Mock-ups
- [ ] 05 Build Splash page static mockup with mock localization button and login card
- [ ] 06 Build Feed/Board page mockup featuring compact Post and Event cards with mockup tags
- [ ] 07 Build Post Detail view with nested, tight comment thread UI
- [ ] 08 Build Event Detail view with attendee avatars and RSVP button states
- [ ] 09 Build Profile page mockup featuring active radius slider and post history tabs

### Phase 3 — Firebase Setup & Authentication Wiring
- [ ] 10 Initialize Firebase App, Auth, Firestore, and Storage in `src/lib/firebase.ts`
- [ ] 11 Implement `AuthContext` and custom hook `useAuth` supporting email login and anonymous onboarding
- [ ] 12 Connect Splash page to Auth, creating the user document in Firestore on first sign-in
- [ ] 13 Implement Profile update handlers (displayName, profile photo, location geohash, and custom local search radius)

### Phase 4 — Local Feed & Media Uploads
- [ ] 14 Set up geolocation lookup helper to get coordinates and resolve neighborhood context
- [ ] 15 Implement PostCreator form supporting photo attachments (uploaded to Firebase Storage)
- [ ] 16 Wire up Firestore query matching posts and events within target user radius using geohash-based filters
- [ ] 17 Implement real-time feed update listeners in `usePosts` hook

### Phase 5 — Interactions, Events & Notifications
- [ ] 18 Add comment posting logic for posts (subcollection writes) and update local counts
- [ ] 19 Implement Event creation interface and RSVP toggle logic (updating event document arrays)
- [ ] 20 Add activity log listener on Firestore for user-triggered notification cards
- [ ] 21 Implement interactive UI details (pull-to-refresh animation, hover micro-animations, skeleton loader states)

---

## Feature Count
- **Phase 1 (Foundation)**: 4 items
- **Phase 2 (Mockups)**: 5 items
- **Phase 3 (Auth)**: 4 items
- **Phase 4 (Local Feed)**: 4 items
- **Phase 5 (Interactions)**: 4 items
- **Total Build Items**: 21 items
