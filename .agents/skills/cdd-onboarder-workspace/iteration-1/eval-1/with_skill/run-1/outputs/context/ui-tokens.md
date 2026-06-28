# UI Tokens

## Colors (HSL Tailored Warm Palette)

### Backgrounds (Dark Default)
- **Primary Page Background**: `hsl(24, 12%, 8%)` - Warm Coal (Deep charcoal with amber undertone)
- **Secondary Card Background**: `hsl(24, 10%, 13%)` - Warm Card (Soft dark charcoal-amber)
- **Surface Elevation / Muted**: `hsl(24, 10%, 18%)` - Warm Popover / Hover state
- **Overlay Glass Background**: `hsla(24, 12%, 8%, 0.75)` - Blurred modal and bottom bar backdrops

### Text Colors
- **Primary Text**: `hsl(30, 24%, 93%)` - Warm Milk (Off-white with a cozy warm tint)
- **Secondary Text**: `hsl(28, 12%, 68%)` - Warm Muted Gray (High-readability body text)
- **Muted Text / Placeholder**: `hsl(28, 8%, 48%)` - Warm Dim Gray (For metadata, sub-labels)

### Accents & Primaries
- **Primary Accent Orange**: `hsl(24, 95%, 58%)` - Amber Fire (Primary button fills, active tabs)
- **Primary Accent Hover**: `hsl(24, 90%, 50%)` - Darker Amber Fire
- **Accent Soft**: `hsla(24, 95%, 58%, 0.15)` - Muted Amber Fire (Highlight badges, text button hovers)
- **Warning / Alert**: `hsl(8, 90%, 58%)` - Local Danger Red (Urgent community notifications)

### Borders
- **Border Default**: `hsl(24, 15%, 20%)` - Subtle warm separator
- **Border Muted**: `hsl(24, 12%, 16%)` - Very soft line divider

---

## Typography
- **Primary Font**: `Inter`, `system-ui`, `-apple-system`, `sans-serif` (Sleek, legible at small screen sizes)
- **Font Sizes**:
  - `text-xs`: 0.75rem / 12px (Metadata, relative timestamps, badges)
  - `text-sm`: 0.875rem / 14px (Core body copy, comments, button labels)
  - `text-base`: 1.0rem / 16px (Post descriptions, active feed header title)
  - `text-lg`: 1.125rem / 18px (Post creator title, modal header)
  - `text-xl`: 1.25rem / 20px (Event header)
- **Font Weights**:
  - `font-normal`: 400 (Body text)
  - `font-medium`: 500 (UI controls, timestamps)
  - `font-semibold`: 600 (Usernames, section headers)
  - `font-bold`: 700 (Titles, primary buttons)

---

## Spacing & Layout (Compact Scale)
To enable density on mobile screens, FeedLoop utilizes a tight, space-efficient padding and margin system:
- **Base Grid / Flex Gap**: `gap-1.5` (6px) or `gap-2` (8px)
- **Card Padding**: `p-3` (12px) - Compact container interior
- **Feed Item Margin**: `my-1.5` (6px) or `space-y-2` (8px) - Maximum content visibility per viewport scroll
- **Comment Padding**: `py-1 px-2` (4px top/bottom, 8px left/right)
- **Header/Footer Height**: `h-12` (48px) - Clean, thin navbar layout

---

## Borders & Radius
- **Border Size**: `border` (1px)
- **Border Radii**:
  - `rounded-lg`: 0.5rem / 8px (Default card container boundary, buttons, avatar images)
  - `rounded-md`: 0.375rem / 6px (Input fields, badges, buttons inside comments)
  - `rounded-full`: 9999px (Floating action buttons, circular avatar containers)
