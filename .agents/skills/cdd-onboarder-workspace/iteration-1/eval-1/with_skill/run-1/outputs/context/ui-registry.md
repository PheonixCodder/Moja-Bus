# UI Registry

Living document. Updated after every component is built. Read this before building any new component — match existing patterns exactly before inventing new ones.

---

## How to Use
Before building any component:
1. Check if a similar component already exists here
2. If yes — match its exact classes
3. If no — build it following ui-rules.md and ui-tokens.md, then add it here

After building any component — update this file with the component name, file path, and exact classes used.

---

## Components

### 1. `TopHeader` (Shell Header)
- **Path**: `src/components/layout/TopHeader.tsx`
- **Purpose**: Displays neighborhood status, app branding, and fast access notification indicators.
- **Classes**:
  `h-12 w-full flex items-center justify-between px-3 border-b border-[hsl(24,15%,20%)] bg-[hsl(24,12%,8%)]/75 backdrop-blur-md sticky top-0 z-50`

### 2. `BottomNav` (Shell Footer Navigation)
- **Path**: `src/components/layout/BottomNav.tsx`
- **Purpose**: Fixed bottom navigation bar with fluid active tab indication.
- **Classes**:
  `h-14 w-full flex items-center justify-around border-t border-[hsl(24,15%,20%)] bg-[hsl(24,12%,8%)]/75 backdrop-blur-md fixed bottom-0 z-50 max-w-md`

### 3. `PostCard` (Feed Post Item)
- **Path**: `src/components/board/PostCard.tsx`
- **Purpose**: Compact card presenting a single post with author, image, category tag, relative time, and interaction counts.
- **Classes**:
  `bg-[hsl(24,10%,13%)] border border-[hsl(24,15%,20%)] rounded-lg p-3 my-1.5 flex flex-col gap-2 hover:bg-[hsl(24,10%,15%)] transition-colors duration-150`

### 4. `EventCard` (Feed Event Item)
- **Path**: `src/components/board/EventCard.tsx`
- **Purpose**: Specialized post representation emphasizing event date/time, RSVP counts, and quick action.
- **Classes**:
  `bg-[hsl(24,10%,13%)] border border-[hsl(24,15%,20%)] rounded-lg p-3 my-1.5 flex flex-col gap-2.5 hover:bg-[hsl(24,10%,15%)] transition-colors duration-150`

### 5. `PostCreator` (Input Dialog/Drawer)
- **Path**: `src/components/board/PostCreator.tsx`
- **Purpose**: Compact overlay form to compose local posts or events.
- **Classes**:
  `fixed inset-x-0 bottom-0 max-w-md mx-auto bg-[hsl(24,10%,13%)] border-t border-[hsl(24,15%,20%)] rounded-t-xl p-4 shadow-xl z-50 transition-transform duration-300 ease-out`
