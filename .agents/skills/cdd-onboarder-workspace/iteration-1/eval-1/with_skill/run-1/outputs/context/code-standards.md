# Code Standards

## Styling & Framework Conventions
- **Component Style**: Use React Functional Components (`const Component: React.FC = () => {}`).
- **Tailwind Ordering**: Arrange classes in logical groups:
  1. Layout & Display (`flex`, `grid`, `block`, `absolute`, `h-full`, `w-full`)
  2. Spacing (`p-2`, `m-1`, `gap-2`, `space-y-1.5`)
  3. Visuals (`bg-warm-900`, `text-amber-100`, `border-warm-700/50`)
  4. Interactions (`hover:bg-warm-800`, `focus:ring-2`, `active:scale-95`)
  5. Transitions (`transition-all`, `duration-200`, `ease-in-out`)
- **Responsive Styling**: Apply mobile-first styling. Always design the base classes for mobile screens, and use md/lg modifiers for desktop scaling constraints.
- **Dark Mode**: FeedLoop is dark mode by default. Set the root class to `dark` in the HTML wrapper. Apply dark styles explicitly using `--colors` or `dark:` prefix class helpers to guarantee dark styling.

## Naming Conventions
- **Components**: PascalCase (e.g., `PostCard.tsx`, `BottomNav.tsx`)
- **Hooks**: camelCase starting with "use" (e.g., `usePosts.ts`, `useAuth.ts`)
- **Utility Modules**: camelCase (e.g., `geoUtils.ts`, `dateHelpers.ts`)
- **Firebase Collections**: Lowercase plural (e.g., `users`, `posts`, `events`)
- **Firestore Document Fields**: camelCase to map cleanly to TypeScript models (e.g., `createdAt`, `displayName`, `imageUrl`)

## TypeScript Standards
- **Explicit Types**: No use of `any`. Define interfaces/types for all data models, props, and custom hook return structures.
- **Null Safety**: Avoid non-null assertions (`!`). Use optional chaining (`?.`) and nullish coalescing (`??`).
- **React Props**: Explicitly type props interfaces. Prefer `React.FC<Props>` or inline parameters with type declarations.

## Firebase Best Practices
- **Atomic Operations**: Use `increment(1)` or `increment(-1)` for comment/like/RSVP counters. Never read, increment in memory, and rewrite.
- **Server Timestamps**: Use `serverTimestamp()` for `createdAt` and `updatedAt` on write operations instead of client-side `new Date()`.
- **Query Optimization**: Keep queries lightweight. Only request essential fields and paginate feeds using `limit()` and `startAfter()`.
- **Transaction/Batching**: Use Firestore batches (`writeBatch`) when creating related entities (e.g., creating a post and updating user post counts simultaneously).
