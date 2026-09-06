# Moja Ride Design & Design-Engineering Audit
## 17. Traveler Mobile App

### 1. Consumer Mobile Experience Archetype

The Traveler Mobile App (`apps/traveler-app`) is an **on-the-go consumer travel companion** built with React Native, Expo Router v57, and NativeWind v4.
A passenger relies on this app while:
- Standing in crowded, noisy bus terminals with one hand holding luggage.
- Dealing with intermittent 3G/4G cellular connectivity.
- Needing instant access to their QR boarding pass for ticket inspection.

---

### 2. Deep-Dive: Core Mobile Screens & Flows

#### 2.1 The Curved SVG Floating Tab Bar
In `apps/traveler-app/app/(tabs)/_layout.tsx`:
- Generates a bespoke curved SVG backdrop (`getCurvedPath`) with a prominent center circular floating search button (`CIRCLE_SIZE = 54`, `PEAK = 22`).
- Uses `react-native-reanimated` to smoothly fade active tab labels and lift active icons.
- **Evaluation**: Highly distinctive aesthetic. Elevates Moja Ride above generic template transit apps.

#### 2.2 Digital Ticket & QR Boarding Pass Sheet
In `apps/traveler-app/features/booking/components/ticket-sheet.tsx`:
- Features an offline-capable SVG QR code (`react-native-qrcode-svg`) generating the exact verification payload scanned by driver terminals.
- Includes one-tap native OS sharing via `Share.share` with haptic feedback (`Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)`).
- Displays clear trip stops, seat numbers, passenger name, and formatted departure times.

#### 2.3 Interactive Bus Seat Selection Sheet
In `apps/traveler-app/features/booking/components/passenger-seat-map.tsx`:
- Seats are shaped like realistic bus seats (`rounded-t-xl rounded-b-2xl`).
- Selected seats light up in high-contrast brand magenta (`bg-[#ee237c] text-white shadow-md shadow-pink-500/30`).
- **Superiority over Web**: This mobile seat map is significantly better designed than the web seat map, which uses plain rectangles and washed-out pastel pink.

---

### 3. Critical Flaws in Traveler Mobile

#### 3.1 Desktop Web Prose Typography in a Mobile App
In `apps/traveler-app/components/ui/text.tsx`:
```tsx
const textVariants = cva("text-foreground text-base", {
  variants: {
    variant: {
      h1: "text-center text-4xl font-extrabold tracking-tight",
      h2: "border-border border-b pb-2 text-3xl font-semibold tracking-tight",
      ...
    }
  }
});
```
- **The Defect**: A text utility originally built for web prose/articles was pasted into a mobile application.
- **The Consequence**: Screen titles styled with `h1` render centered at 36px (`text-4xl`), wrapping awkwardly on smaller phones (iPhone SE). Section headings styled with `h2` render at 30px with a horizontal divider line (`border-b pb-2`), disrupting list cards and form groups.

#### 3.2 Locked Light Theme with Dead Dark Code
- In `apps/traveler-app/global.css`: Lines 31–50 define an entire `.dark:root` block with HSL variables.
- In `apps/traveler-app/components/ui/`: Dozens of components write `dark:bg-input/30`, `dark:border-input`, `dark:bg-destructive/60`.
- In `apps/traveler-app/app/_layout.tsx` line 26:
  The runtime permanently wraps the app in `<ThemeProvider value={LightTheme}>` with no dark mode toggle or system color scheme listener.
- **Result**: The app carries dark mode code weight and maintenance debt, but is permanently frozen in light mode.

#### 3.3 Touch Target Deficits
- Buttons in `apps/traveler-app/components/ui/button.tsx` default to `h-10` (40px) or `sm:h-9` (36px).
- These fall short of Apple's 44px HIG minimum and Google's 48px Material minimum, creating touch frustration for users with larger fingers or while walking.

---

### 4. Traveler Mobile Scorecard

| Dimension | Score | Comments |
| :--- | :---: | :--- |
| **Visual Distinctiveness** | `8.2 / 10` | Custom curved tab bar and bus-silhouette seat map look premium. |
| **Mobile Ergonomics** | `6.0 / 10` | Button touch targets are slightly undersized; lacks pull-to-refresh on some views. |
| **Typography Appropriateness** | `4.0 / 10` | Web prose typography variants (`h1`, `h2` with border) must be replaced. |
| **State Completeness** | `5.5 / 10` | Offline ticket QR works well; form inputs lack coupled error states. |
| **Theme Coherence** | `5.0 / 10` | Locked to light mode; unused dark mode CSS bloat. |

---

### 5. Traveler Mobile Remediation Roadmap

1. **Replace `text.tsx` Variants**:
   - Align mobile typography with `driver-app/constants/theme.ts` (`h1` = 28px, `h2` = 22px, `h3` = 18px, `body-md` = 14px, with zero underline borders).
2. **Increase Minimum Touch Heights**:
   - Ensure all interactive buttons have `minHeight: 44` (or 48dp on Android).
3. **Resolve Dark Mode Ambiguity**:
   - Either implement dynamic dark mode switching based on `useColorScheme()`, or strip dead `.dark:` CSS rules to reduce bundle complexity.
