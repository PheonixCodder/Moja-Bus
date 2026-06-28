# Architecture

## Tech Stack
- **Framework**: React 18+ (Vite, TypeScript)
- **Styling**: Tailwind CSS v3+ (Default Dark Mode, HSL dynamic palette)
- **Routing**: React Router v6 (SPA Client Routing)
- **Backend & DB**: Firebase v10+ (Auth, Firestore, Storage)
- **Icons**: Lucide React
- **Helpers**: Date-fns (for localized compact timestamps), Geofirecommon (for proximity-based queries)

## Folder Structure
```
src/
├── assets/            # Static image assets, icons, splash graphic
├── components/        # Reusable visual components
│   ├── ui/            # Atomic primitives (Button, Card, Input, Avatar, Badge)
│   ├── layout/        # App shell (BottomNav, TopHeader, PullToRefresh)
│   └── board/         # Domain components (PostCard, EventCard, ReplyList, PostCreator)
├── context/           # React Context Providers (AuthContext, LocationContext)
├── hooks/             # Custom React Hooks (useAuth, usePosts, useLocation, useStorage)
├── lib/               # Third-party configurations & clients
│   └── firebase.ts    # Firebase client initialization
├── routes/            # Main Page level components
│   ├── Splash.tsx     # Landing, sign-in, location prompt
│   ├── Board.tsx      # Main community feed & events board
│   ├── PostDetail.tsx # Detailed view of a post with thread replies
│   ├── EventDetail.tsx# Event details, RSVP list, location link
│   ├── Profile.tsx    # User settings, radius modifier, post history
│   └── Notifications.tsx # Activity log
├── styles/            # Styling files (index.css with design tokens)
├── App.tsx            # Main layout wrapper & route registry
└── main.tsx           # React mounting element
```

## Data Models

### Users (`users/{userId}`)
```typescript
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  radiusMiles: number; // 0.5, 1.0, 5.0, etc.
  homeLocation: {
    geohash: string;
    lat: number;
    lng: number;
  };
  createdAt: string; // ISO string
}
```

### Posts (`posts/{postId}`)
```typescript
interface Post {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL: string;
  content: string;
  imageUrl?: string;
  location: {
    geohash: string;
    lat: number;
    lng: number;
    addressDescription?: string; // e.g., "Main St & 3rd"
  };
  commentCount: number;
  likes: string[]; // Array of userIds who liked
  createdAt: string; // ISO string
}
```

### Replies (`posts/{postId}/replies/{replyId}`)
```typescript
interface Reply {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL: string;
  content: string;
  createdAt: string; // ISO string
}
```

### Events (`events/{eventId}`)
```typescript
interface LocalEvent {
  id: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  startDateTime: string; // ISO string
  endDateTime: string; // ISO string
  location: {
    address: string;
    geohash: string;
    lat: number;
    lng: number;
  };
  rsvps: string[]; // Array of userIds RSVPed
  commentCount: number;
  createdAt: string; // ISO string
}
```

## Architectural Invariants
1. **Mobile-First Boundary**: The UI must be fully constrained to mobile layouts. On wider screens, it must center itself in a `max-w-md` container with a dark background border matching the HSL warm tones.
2. **Firebase Encapsulation**: Never call Firebase Auth, Firestore, or Storage directly from page or component code. Use custom wrappers (`useAuth`, `usePosts`, `useStorage`) or custom service contexts.
3. **Strict Local Querying**: All queries for feeds or events must calculate proximity. A post must only be displayed if its coordinate distance to the user's active homeLocation is `<= radiusMiles`.
4. **Subscription Cleanup**: Every `onSnapshot` real-time listener must be returned inside a React `useEffect` cleanup function to prevent memory leaks and billing overages.
5. **No Direct Writes to Global State**: All data updates (creating posts, RSVPs, updating profiles) must propagate to Firebase and update the local state reactivity via snapshots or optimistic updates.
