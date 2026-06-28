# UI Rules

## Global Layout Rules
- **Mobile Centering (Desktop Viewports)**: The outer viewport wrapper must restrict the app's rendering area:
  ```html
  <div class="w-full max-w-md mx-auto min-h-screen bg-[hsl(24,12%,8%)] border-x border-[hsl(24,15%,20%)] flex flex-col relative shadow-2xl">
    <!-- Headers, Scrollable Content, Navigation Shell goes here -->
  </div>
  ```
- **Scrolling Containers**: The main feed scroll container must use `flex-1 overflow-y-auto` and support dynamic height adjustment based on screen keyboard popup states.
- **Glassmorphism Navbars**: Top headers and bottom navigation bars must use glassmorphic backdrops to suggest layered depth:
  ```css
  background-color: hsla(24, 12%, 8%, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  ```

---

## Interaction & States
- **Button Micro-feedback**: Any interactive button (like, RSVP, reply, save) must scale slightly down on touch to provide concrete physical feedback:
  ```css
  transition-all duration-100 ease-out;
  active:scale-97;
  ```
- **Clickable Cards**: Cards that lead to a detail page must hover-glow slightly:
  `hover:bg-[hsl(24,10%,15%)] active:bg-[hsl(24,10%,18%)]`
- **Active Navigation States**: Active tabs in the bottom bar display with high-contrast accent color `hsl(24, 95%, 58%)` and a tiny dot indicator underneath, while inactive tabs use `hsl(28, 12%, 68%)`.
- **Form Focus Outline**: Input fields must never show browser-native blue rings. Use custom warm rings:
  `focus:outline-none focus:ring-1 focus:ring-[hsl(24,95%,58%)] focus:border-[hsl(24,95%,58%)]`

---

## Animations & Transitions
- **Feed Item Fade-In**: Newly fetched posts or replies should fade-in from the bottom using a quick opacity animation to smooth the loading transition:
  ```css
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  ```
- **Slide-Up Post Creator**: When hitting the centered "+" FAB, the creation drawer must slide up from the bottom with an ease-out transition.
- **Pull-To-Refresh Indicator**: Pull-down triggers a loading spinner that rotates and expands. Clean transition back to hidden once query completes.
