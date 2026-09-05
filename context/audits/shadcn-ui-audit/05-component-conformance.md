# 05 — Component Conformance

## Generation model difference (applies to almost every styled component)

| Generation | Reference (pinned, base + nova) | Moja `@moja/ui` |
|------------|----------------------------------|-----------------|
| `cn` import | `from "cn"` | `from "#lib/utils"` (local) |
| Class strategy | Token classes: `cn-button`, `cn-button-variant-default` in `style-nova.css` | Full Tailwind strings inside `cva(...)` |
| Icons | Often `IconPlaceholder` in registry templates | Direct `lucide-react` icons |

**Verdict for styling strategy:** This is a **generation gap**, not random noise. Moja looks like Base UI API + Nova density/spacing **before** (or without) the CSS class-token extraction. Visually can still be Nova-like; upgrade path vs reference differs.

**Customization classification for this gap:**  
- If Moja chooses to stay on inline-CVA: document as intentional **KEEP BUT REFACTOR config**.  
- If Moja wants max CLI fidelity: **REIMPLEMENT FROM CURRENT REFERENCE** (style CSS + regenerate).

---

## Component inventory

| Set | Count |
|-----|-------|
| Ours (`packages/ui/.../ui/*.tsx`) | 62 |
| Reference base UI | 62 registry files (+ chat/attachment extras we lack) |
| Client components (`"use client"`) | 42 |

### Present only in Moja (extensions)

`action-drawer`, `carrier-avatar`, `user-avatar`, `phone-input`, `date-picker`, `date-time-picker`, `time-picker`

### Present only in reference base (not in Moja)

`attachment`, `bubble`, `marker`, `message`, `message-scroller`, `questionnaire`, `toast` (sonner covers toast UX)

---

## Per-component audit (summary)

Legend: **P** = Pass · **PC** = Pass with intentional customization · **MI** = Minor · **MO** = Moderate · **MA** = Major · **CR** = Critical

| Component | Primitive match (vs base) | API | Styling gen | A11y risk | Customization | Verdict |
|-----------|---------------------------|-----|-------------|-----------|---------------|---------|
| accordion | Yes | Close | Inline vs cn-* | Low | Generation | MO |
| action-drawer | n/a custom | asChild on Vaul | — | Med | Moja | MO |
| alert | Yes | Close | Inline | Low | Gen | MI |
| alert-dialog | Yes | Close | Inline | Low | Gen | MI |
| aspect-ratio | Yes (CSS) | Close | — | Low | — | P |
| avatar | Yes | Close | Inline | Low | Gen | MI |
| badge | Yes (useRender) | Close | Inline + extras? | Low | Gen / brand | PC |
| breadcrumb | Yes | Close | Inline | Low | Gen | MI |
| button | Yes | Close | **Major gen gap** | Low | Gen | MO |
| button-group | Yes | Close | Inline | Low | Gen | MI |
| calendar | Shared | Close | — | Low | — | P |
| card | Yes | Close | Inline | Low | Gen | MI |
| carousel | Shared | Close | — | Low | — | P |
| carrier-avatar | Custom | n/a | Brand | Low | KEEP | PC |
| chart | Shared | Close (~336 vs 333 lines) | — | Med (charts) | Near match | P |
| checkbox | Yes | Close | Inline | Low | Gen | MI |
| collapsible | Yes | Close | Inline | Low | Gen | MI |
| combobox | Yes | Close | Inline | Med | Gen | MI |
| command | Shared cmdk | Close | — | Med | — | P |
| context-menu | Yes | Close | Inline | Med | Gen | MI |
| date-picker | Composite | render | — | Med | KEEP | PC |
| date-time-picker | Composite | render | — | Med | KEEP | PC |
| dialog | Yes | Close | Inline | Med | Gen | MI |
| direction | Yes | Re-export | — | Low | — | P |
| drawer | **No** (Vaul) | Vaul API | — | **High** | Half-migration | **MA** |
| dropdown-menu | Yes + shim | **asChild/`any`** | Inline | **High** | Broken migration | **MA** |
| empty | Yes | Close | Inline | Low | Gen | MI |
| field | Yes | Close (+extras?) | Inline | Low | Gen | MI |
| hover-card | Yes | Close | Inline | Low | Gen | MI |
| input | Yes | Close | Inline | Low | Gen | P |
| input-group | Yes | Close | Inline | Low | Gen | MI |
| input-otp | Shared | Close | — | Low | — | P |
| item | Yes | Close | Inline | Low | Gen | MI |
| kbd | Yes | Close | — | Low | — | P |
| label | Yes (native) | Close | Inline | Low | Gen | P |
| menubar | Yes | Close | Inline | Med | Gen | MI |
| native-select | Yes | Close | — | Low | — | P |
| navigation-menu | Yes | Close | Inline | Med | Gen | MI |
| pagination | Yes | Close | Inline | Low | Gen | MI |
| phone-input | Custom | `as any` country | — | Med | KEEP BUT types | MO |
| popover | Yes | Close | Inline | Med | Gen | MI |
| progress | Yes | Close | Inline | Low | Gen | MI |
| radio-group | Yes | Close | Inline | Low | Gen | MI |
| resizable | Shared | Close | — | Low | — | P |
| scroll-area | Yes | Close | Inline | Low | Gen | MI |
| select | Yes | Close | Inline | Med | Gen | MI |
| separator | Yes | Close | Inline | Low | Gen | P |
| sheet | Yes (dialog) | Close | Inline | Med | Gen | MI |
| sidebar | Yes | Close | Inline | Med | Gen | MI |
| skeleton | Yes | Close | — | Low | — | P |
| slider | Yes | Close | Inline | Low | Gen | MI |
| sonner | Shared | Close | — | Low | — | P |
| spinner | Yes | Close | — | Low | — | P |
| switch | Yes | Close | Inline | Low | Gen | MI |
| table | Yes | Close | Inline | Low | Gen | MI |
| tabs | Yes | Close | Inline | Low | Gen | MI |
| textarea | Yes | Close | Inline | Low | Gen | P |
| time-picker | Composite | render | — | Med | KEEP | PC |
| toggle | Yes | Close | Inline | Low | Gen | MI |
| toggle-group | Yes | Close | Inline | Low | Gen | MI |
| tooltip | Yes + `as any` | Weak types | Inline | Med | Types | MO |
| user-avatar | Custom | n/a | Brand | Low | KEEP | PC |

---

## Components that must be rebuilt / replaced

| Component | Action |
|-----------|--------|
| drawer (+ action-drawer close API) | **REIMPLEMENT** from base drawer **or** document Vaul KEEP + fix asChild |
| dropdown-menu | **REFACTOR** — remove asChild shim, restore types from reference |
| tooltip | **REFACTOR** — remove `as any` |

## Components unnecessarily modified (relative to base API)

Most “diffs” are the **styling generation gap**, not ad-hoc business hacks. That is systemic (SHADCN-002), not 50 independent mistakes.

True unnecessary / harmful mods:

- dropdown-menu asChild compatibility layer
- tooltip `as any`
- drawer stuck on Vaul while rest is Base
- globals.css Radix height CSS variables

---

## Intentional KEEP list

- Brand theme colors / radius in `@moja/theme`
- `carrier-avatar`, `user-avatar`, initials helpers
- `phone-input`
- date/time picker composites
- Drawer `modal={false}` **if** product needs non-modal drawers — keep behavior when migrating to Base drawer via prop default
