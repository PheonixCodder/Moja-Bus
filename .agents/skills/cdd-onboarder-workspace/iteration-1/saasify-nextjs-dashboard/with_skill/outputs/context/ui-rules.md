# UI Rules

## Global Layout Rules
- **Mobile-First Responsiveness**: All custom interfaces must start with mobile viewports in mind (`<640px`) and expand up to desktop configurations. Avoid hardcoded pixel widths on larger parent containers; use relative percentages, grid templates, or standard flex layouts.
- **Responsive Navigation**:
  - The navigation sidebar is visible by default on screens `lg` (1024px) and above.
  - On screens smaller than `1024px`, the sidebar must slide out from the left (using a drawer layout triggered by a header hamburger button) or collapse into a bottom navigation bar.
- **Scroll Containment**:
  - The dashboard app shell operates as a fixed-height layout: the top header and sidebar remain locked in place (`fixed` or `sticky`), while the main page body scrolls independently (`overflow-y-auto`).
  - Tables (such as the invoice lists) must always be wrapped in an `overflow-x-auto` utility wrapper to prevent layout breakage on mobile.

## Interaction & States
- **Keyboard Access & Focus Indicators**: All interactive elements (buttons, inputs, links, dropdown items) must support keyboard navigation. When focused via keyboard, display a visible indicator: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950`.
- **Button Hover Feedback**:
  - Primary buttons (`bg-teal-500`): Fade to hover color `hover:bg-teal-600` and scale down slightly on click (`active:scale-[0.98] transition-all`).
  - Secondary buttons (`bg-slate-800`): Lighten on hover `hover:bg-slate-700` with transition-colors enabled.
- **Active Navigation States**: Highlight the current page in the sidebar menu using a combination of a subtle background highlight and a solid border indicator:
  - Tailwind helper classes: `bg-teal-500/10 text-teal-400 border-l-2 border-teal-500`
- **Disabled State Standard**: Add `opacity-50 cursor-not-allowed select-none` to elements that are disabled. Ensure standard form controls have `disabled` HTML attributes to disable mouse and key listeners.

## Animations & Transitions
- **Standard Transition Speed**: Use standard transition configurations for hover states and color modifications: `transition-all duration-200 ease-in-out`.
- **Modal View Transitions**: Modals (like the "New Invoice" form overlay) must use a combined backdrop fade-in and scale-up transition:
  - Backdrop: `transition-opacity duration-300 ease-out`
  - Modal Card: `transition-all duration-300 ease-out transform scale-95 opacity-0` translating to `scale-100 opacity-100` when active.
- **Sidebar Collapse Motion**: The sidebar width modification (toggling between `w-64` and `w-20`) must animate smoothly: `transition-[width] duration-300 ease-in-out`.
- **Tooltip Animations**: Tooltips must fade in and rise slightly: `transition-all duration-150 ease-out translate-y-1 opacity-0` to `translate-y-0 opacity-100`.
