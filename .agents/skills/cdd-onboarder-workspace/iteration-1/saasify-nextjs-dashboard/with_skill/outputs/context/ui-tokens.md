# UI Tokens

## Colors
We use a premium, modern, slate-and-teal theme designed for deep contrast, readability, and visual appeal. Under the hood, these map to HSL variables in `index.css`.

### Theme Palettes
- **Light Theme**:
  - `background`: `bg-slate-50` (HSL `210 20% 98%`)
  - `foreground`: `text-slate-900` (HSL `222 47% 11%`)
  - `card`: `bg-white` (HSL `0 0% 100%`)
  - `card-border`: `border-slate-200/60` (HSL `214.3 31.8% 91.4%`)
  - `primary`: `bg-teal-600` / `hover:bg-teal-700` (HSL `174 84% 33%`)
  - `primary-foreground`: `text-white` (HSL `210 20% 98%`)
  - `secondary`: `bg-slate-100` / `hover:bg-slate-200` (HSL `210 40% 96.1%`)
  - `secondary-foreground`: `text-slate-900` (HSL `222 47% 11%`)
  - `accent-indigo`: `bg-indigo-600` / `text-indigo-600` (HSL `243 75% 59%`)

- **Dark Theme (Default App Shell)**:
  - `background`: `bg-slate-950` (HSL `224 71% 4%`)
  - `foreground`: `text-slate-50` (HSL `210 20% 98%`)
  - `card`: `bg-slate-900/50 backdrop-blur-md` (HSL `222.2 84% 4.9%` with 50% opacity)
  - `card-border`: `border-slate-800/80` (HSL `217.2 32.6% 17.5%`)
  - `primary`: `bg-teal-400` / `hover:bg-teal-500` (HSL `174 84% 41%`)
  - `primary-foreground`: `text-slate-950` (HSL `224 71% 4%`)
  - `secondary`: `bg-slate-800` / `hover:bg-slate-700` (HSL `217.2 32.6% 17.5%`)
  - `secondary-foreground`: `text-slate-50` (HSL `210 20% 98%`)
  - `accent-indigo`: `bg-indigo-500` / `text-indigo-400` (HSL `243 75% 65%`)

### Status Colors
- **Success (Paid)**: Emerald theme (Light: `text-emerald-700 bg-emerald-50`, Dark: `text-emerald-400 bg-emerald-950/40 border border-emerald-900/50`)
- **Warning (Pending)**: Amber/Orange theme (Light: `text-amber-700 bg-amber-50`, Dark: `text-amber-400 bg-amber-950/40 border border-amber-900/50`)
- **Error (Overdue)**: Rose/Red theme (Light: `text-rose-700 bg-rose-50`, Dark: `text-rose-400 bg-rose-950/40 border border-rose-900/50`)

---

## Typography
We load **Inter** (for UI elements and data layouts) and **Outfit** (for headings, marketing layouts, and dashboard titles) from Google Fonts.

- **Weight Classes**:
  - `font-normal`: `400` (default body text)
  - `font-medium`: `505` (tabs, table headers, form labels)
  - `font-semibold`: `600` (card titles, secondary headers)
  - `font-bold`: `700` (main headers, display numbers)
- **Size Scale**:
  - `text-xs`: `12px` (helper labels, invoice dates, small indicators)
  - `text-sm`: `14px` (regular UI details, tables, inputs)
  - `text-base`: `16px` (main body text, values, buttons)
  - `text-lg`: `18px` (subtitles, secondary card values)
  - `text-xl`: `20px` (standard card metrics headers)
  - `text-2xl`: `24px` (dashboard section headers)
  - `text-3xl`: `30px` (large statistics, metric values)
  - `text-4xl`: `36px` (hero layout headers, page entry titles)

---

## Spacing & Layout
- **App Shell Sizing**:
  - Left navigation sidebar width: `w-64` (256px)
  - Top header height: `h-16` (64px)
- **Grid & Gap Scale**:
  - `gap-4` (16px) for smaller metric card grids.
  - `gap-6` (24px) for major layout content spacing.
- **Section Padding**:
  - Landing pages: `py-16 md:py-24 px-6 lg:px-8`
  - Dashboard panels: `p-6` (desktop) and `p-4` (mobile)

---

## Borders & Radius
- **Border Sizing**:
  - Standard borders: `border` (1px)
  - Accents: `border-2` (2px)
- **Border Radii**:
  - Small elements (inputs, tooltips): `rounded-md` (6px)
  - Medium elements (buttons, badge status pills): `rounded-lg` (8px)
  - Large elements (dashboard cards, table containers): `rounded-xl` (12px)
  - Sub-elements (profile avatar circles, scroll limits): `rounded-full` (9999px)
