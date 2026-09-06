# Moja Ride Design & Design-Engineering Audit
## 31. The Moja Ride Design System Blueprint ("Moja DS")

### 1. Core Design Philosophy & Principles

Moja Ride operates at the intersection of **intercity transport**, **African fintech**, and **fleet logistics**.
Its design system must embody four immutable principles:

1. **Velocity Over Decoration (Transport Velocity)**:
   - Passengers booking on 3G cellular connections and dispatchers managing boarding gates require immediate clarity.
   - Decorative visual noise, unnecessary nested cards, and heavy gradient soup are eliminated in favor of clean information hierarchy.
2. **Financial Precision & Trust (Financial Clarity)**:
   - Fares, fees, wallet floats, and carrier payables are presented with uncompromised precision: standardized currency nomenclature, tabular numerals (`tabular-nums`), and non-breaking spaces.
3. **Context-Appropriate Density (Adaptive Density)**:
   - One universal density does not fit all.
   - Consumer discovery thrives on comfortable breathing room (`48px–56px` cards).
   - Operational dispatch desks require high scanning density (`40px–44px` table rows).
   - In-cab vehicle operation requires tactical touch targets (`52px–60px` buttons).
4. **Tactile & Immediate Feedback (Physical Reassurance)**:
   - Physical travel is visceral. The digital interface provides clear tactile reassurance: haptic pulses on mobile scans, unambiguous countdowns on held seats, and instant visual state transitions.

---

### 2. Multi-Tier Token Architecture

```
                    Moja DS Canonical Token Flow
┌────────────────────────────────────────────────────────────────────┐
│ TIER 1: GLOBAL PRIMITIVES (@moja/theme/primitives.ts)              │
│  - Palette: Rose (#ee237c), Emerald, Amber, Blue, Zinc             │
│  - Spacing: 4px base (4, 8, 12, 16, 20, 24, 32, 48, 64)            │
│  - Radius:  sm (6px), md (8px), lg (10px), xl (14px), full (9999px) │
└─────────────────────────────────┬──────────────────────────────────┘
                                  │
┌─────────────────────────────────▼──────────────────────────────────┐
│ TIER 2: SEMANTIC TOKENS (@moja/theme/semantic.ts)                  │
│  - Light & Dark modes mapped in OKLCH                              │
│  - Surfaces: canvas, surface, elevated, subtle, overlay            │
│  - Actions:  primary, primary-hover, secondary, destructive        │
│  - Statuses: success, warning, destructive, info                   │
│  - Text:     foreground, muted-foreground, subtle-foreground       │
└─────────────────────────────────┬──────────────────────────────────┘
                                  │
          ┌───────────────────────┴───────────────────────┐
          ▼                                               ▼
┌───────────────────────────────┐               ┌───────────────────────────────┐
│ WEB CSS THEME                 │               │ NATIVEWIND / MOBILE THEME     │
│ (@theme inline in Tailwind v4)│               │ (Exported JS theme contract)  │
│ --color-background            │               │ theme.colors.background       │
│ --color-card                  │               │ theme.colors.card             │
│ --color-primary               │               │ theme.colors.primary          │
└───────────────────────────────┘               └───────────────────────────────┘
```

---

### 3. Canonical Color Architecture (Light & Dark OKLCH)

```css
:root {
  /* Brand Core */
  --primary: #ee237c;
  --primary-foreground: #ffffff;
  --primary-hover: oklch(0.58 0.26 29.2);

  /* Neutrals - Light */
  --background: oklch(1 0 0);               /* Pure white canvas */
  --card: oklch(1 0 0);                     /* Clean surface */
  --card-elevated: oklch(0.985 0 0);        /* Subtle elevation */
  --foreground: oklch(0.145 0 0);           /* Slate-950 high contrast text */
  --muted: oklch(0.965 0 0);                /* Subtle gray background */
  --muted-foreground: oklch(0.52 0 0);      /* Readable secondary text */
  --border: oklch(0.915 0 0);               /* Crisp perimeter lines */
  --input: oklch(0.915 0 0);

  /* Semantic Statuses - Light */
  --success: oklch(0.627 0.194 149.2);      /* Emerald */
  --success-subtle: oklch(0.96 0.04 149.2);
  --success-foreground: #ffffff;

  --warning: oklch(0.769 0.188 70.1);       /* Amber */
  --warning-subtle: oklch(0.97 0.05 70.1);
  --warning-foreground: oklch(0.2 0 0);

  --destructive: oklch(0.577 0.245 27.3);   /* Red / Rose */
  --destructive-subtle: oklch(0.97 0.04 27.3);
  --destructive-foreground: #ffffff;

  --info: oklch(0.6 0.118 227.4);           /* Cobalt Blue */
  --info-subtle: oklch(0.96 0.03 227.4);
  --info-foreground: #ffffff;
}

.dark {
  /* Brand Core */
  --primary: #ee237c;
  --primary-foreground: #ffffff;
  --primary-hover: oklch(0.68 0.25 29.2);

  /* Neutrals - Dark */
  --background: oklch(0.12 0 0);            /* Deep OLED Black-Gray (#09090b) */
  --card: oklch(0.17 0 0);                  /* Surface (#18181b) */
  --card-elevated: oklch(0.22 0 0);         /* Elevated (#27272a) */
  --foreground: oklch(0.985 0 0);           /* Crisp white text */
  --muted: oklch(0.22 0 0);
  --muted-foreground: oklch(0.68 0 0);      /* Readable secondary text */
  --border: oklch(0.25 0 0);                /* Subtle border */
  --input: oklch(0.25 0 0);

  /* Semantic Statuses - Dark */
  --success: oklch(0.68 0.18 149.2);
  --success-subtle: oklch(0.2 0.06 149.2);
  --success-foreground: #ffffff;

  --warning: oklch(0.78 0.18 70.1);
  --warning-subtle: oklch(0.22 0.06 70.1);
  --warning-foreground: #ffffff;

  --destructive: oklch(0.65 0.22 27.3);
  --destructive-subtle: oklch(0.22 0.06 27.3);
  --destructive-foreground: #ffffff;

  --info: oklch(0.68 0.14 227.4);
  --info-subtle: oklch(0.22 0.06 227.4);
  --info-foreground: #ffffff;
}
```

---

### 4. Canonical Typography Scale

```
Typography Ladder (Shared Scale across Web & Mobile)
┌──────────────┬──────────┬─────────────┬──────────┬──────────────────────┐
│ Token        │ Size     │ Line Height │ Weight   │ Intended Role        │
├──────────────┼──────────┼─────────────┼──────────┼──────────────────────┤
│ display      │ 32px     │ 40px        │ Bold 700 │ Marketing / Landing  │
│ title-large  │ 24px     │ 32px        │ Bold 700 │ Screen / Page Title  │
│ title-medium │ 20px     │ 28px        │ SemiBold │ Section Card Title   │
│ title-small  │ 16px     │ 24px        │ SemiBold │ Sub-section / Drawer │
│ body-large   │ 16px     │ 24px        │ Regular  │ Featured / Lead Text │
│ body-default │ 14px     │ 20px        │ Regular  │ Standard UI / Forms  │
│ caption      │ 12px     │ 16px        │ Regular  │ Metadata / Footers   │
│ micro        │ 11px     │ 14px        │ SemiBold │ Status Badges & Tags │
└──────────────┴──────────┴─────────────┴──────────┴──────────────────────┘
*All numeric financial values and countdowns enforce: font-sans tabular-nums
```

---

### 5. Standardized Control Heights & Touch Ergonomics

| Control Role | Web Desktop | Web Mobile / Traveler Mobile | Driver Mobile (In-Cab) |
| :--- | :---: | :---: | :---: |
| **Primary Action Button** | `h-10` (40px) | `h-11` (44px min) | `h-13` / `h-15` (52px–60px) |
| **Secondary Button** | `h-9` (36px) | `h-10` (40px) | `h-13` (52px) |
| **Table Action Button** | `h-8` (32px) | `h-9` (36px) | N/A |
| **Text Form Input** | `h-10` (40px) | `h-11` (44px min) | `h-14` (56px) |
| **Table Row Height** | `h-11` (44px) | `h-14` (56px card) | `h-16` (64px row) |

---

### 6. Architectural Rules of Engagement

1. **Zero Ghost Tokens**: No developer or AI agent may introduce a class beginning with `bg-bg-`, `text-text-`, or `border-border-`. All colors must resolve directly to canonical semantic tokens (`text-foreground`, `text-muted-foreground`, `bg-card`, `bg-background`).
2. **Mandatory State Model on Interactive Primitives**:
   - `Button` must expose `loading?: boolean` and lock its layout dimensions during async execution.
   - `Badge` must expose `variant="success" | "warning" | "destructive" | "info" | "outline" | "default"`.
3. **Centralized Domain Statuses**:
   - No view may define a local `STATUS_CONFIG` object. All status presentations must import `<StatusBadge>` from `@moja/ui`.
4. **Context-Driven Density Enforcement**:
   - Operator and Admin list views must use `@tanstack/react-table` with compact density.
   - Passenger consumer views use cards with clear breathing room.
   - Driver in-cab views strictly maintain `maxWidth: 480` and 52px+ touch targets.
