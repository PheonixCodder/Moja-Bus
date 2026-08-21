# Moja Bus Driver System — UI Tokens

Design tokens and styling values shared across the Operator Web Dashboard and Driver Mobile App (`apps/driver-app`).

---

## 1. Brand & Semantic Colors

| Token Name | Hex Value | Semantic Usage |
| :--- | :--- | :--- |
| **Primary (Moja Brand)** | `#E11D48` / `rgb(225, 29, 72)` | Primary CTA, active tab indicator, live route polyline |
| **Primary Foreground** | `#FFFFFF` | Text on primary brand buttons |
| **Status: On Duty / Online** | `#10B981` (Emerald 500) | Driver on duty badge, GPS streaming indicator, valid ticket scan |
| **Status: On Trip / Active** | `#3B82F6` (Blue 500) | In-transit bus badge, active passenger trip indicator |
| **Status: Resting / Inactive** | `#F59E0B` (Amber 500) | Driver rest shift badge, minor delay warning |
| **Status: Suspended / Offline** | `#6B7280` (Gray 500) | Offline driver status, terminal closed state |
| **Error / Alert / Anomaly** | `#EF4444` (Red 500) | Invalid ticket, GPS jump anomaly, expired driving license |
| **Dark Background** | `#09090B` (Zinc 950) | Driver night HUD mode, traveler map overlay background |
| **Surface Card (Light)** | `#FFFFFF` | Driver manifest card, operator table row |
| **Surface Card (Dark)** | `#18181B` (Zinc 900) | Driver night mode cards, map HUD cards |

---

## 2. Typography
- **Headings**: Montserrat / System Bold (`font-bold tracking-tight`)
- **Body & Captions**: Inter / System Regular (`font-normal text-sm leading-relaxed`)
- **Telemetry HUD & Speedometer Numbers**: Monospace / DIN (`font-mono text-3xl font-extrabold tracking-widest`)

---

## 3. Radii & Spacing
- **Cards & Modals**: `rounded-2xl` (16px) for mobile cards, `rounded-xl` (12px) for web ERP tables.
- **Buttons & Badges**: `rounded-full` (pills) for status indicators, `rounded-xl` for primary action buttons.
- **Touch Target Minimums (Driver App)**: Minimum `48px x 48px` clickable tap area to ensure ease of operation while in vehicle dock.
