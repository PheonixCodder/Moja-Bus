# Progress Tracker

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status
**Phase:** Phase 1 — Styling Foundation & App Shell
**Last completed:** Initial project blueprint & CDD Context system configuration (onboarding complete)
**Next:** `01 Configure Vite project with TypeScript and Tailwind CSS`

---

## Progress

### Phase 1 — Styling Foundation & App Shell (5% Completed)
- [x] 00 Onboard project details & setup context files
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

## Decisions Made During Build
- **Dark Mode Default**: Set HSL warm color values directly in the CSS layer, configuring class-based dark mode toggles to ensure the app is visually optimized for late-night community usage.
- **Mobile Centering**: Restricting the viewport to `max-w-md` ensures that desktop browsers see the app as a centered mock mobile device with clean dark borders.

---

## Notes
- *Note:* Make sure to test location services gracefully; add fallbacks if a neighbor rejects browser location sharing.
