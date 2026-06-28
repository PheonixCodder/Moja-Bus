# Library Docs

## Firebase Client SDK (v10)
All Firebase operations are handled in custom hooks and contexts.

### Firebase Initialization (`src/lib/firebase.ts`)
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

### Real-Time Board Listening with Geohash Query
To fetch local posts efficiently, Firestore queries match bounding box ranges computed from coordinates:
```typescript
import { collection, query, orderBy, startAt, endAt, limit, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

// Helper to query documents within a geohash bounding box
export const subscribeToLocalPosts = (
  bounds: [string, string][], 
  callback: (posts: any[]) => void
) => {
  const collectionRef = collection(db, 'posts');
  
  // Create queries for each boundary block
  const listeners = bounds.map(([start, end]) => {
    const q = query(
      collectionRef,
      orderBy('location.geohash'),
      startAt(start),
      endAt(end),
      limit(50)
    );
    
    return onSnapshot(q, (snapshot) => {
      // Process and return updates
    });
  });
  
  // Cleanup callback to unsubscribe all listeners
  return () => listeners.forEach(unsub => unsub());
};
```

---

## Lucide React
Use lightweight Lucide SVG icons. Import icons directly to ensure bundler tree-shaking works correctly:
```typescript
import { Home, Bell, Plus, User, Calendar, MapPin, MessageSquare, Send } from 'lucide-react';
```
**Constraint**: Keep icons consistently styled across the app. Use `w-5 h-5` for tab bars, `w-4 h-4` for action icons in cards, and `stroke-width` of `2` or `1.5`.

---

## Date-fns
Used to display real-time posts in a compact, human-readable relative format:
```typescript
import { formatDistanceToNowStrict } from 'date-fns';

const timeAgo = formatDistanceToNowStrict(new Date(post.createdAt), { addSuffix: true });
// Output: "3m ago", "2h ago", "1d ago"
```
**Constraint**: Use the strict version `formatDistanceToNowStrict` to keep labels tight and short for mobile-first views.
