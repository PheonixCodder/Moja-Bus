# 12 — Component Findings (Consolidated)

Component-specific findings only. Cross-cutting IDs live in `13-complete-findings.md`.

| Component | Finding | Severity | Action |
|-----------|---------|----------|--------|
| **(system) all styled** | Inline CVA vs reference `cn-*` + style-nova.css | HIGH | Decide strategy (SHADCN-002) |
| **(system) config** | `radix-nova` vs Base UI code | CRITICAL | Set `base-nova` |
| accordion | CSS keyframes still `--radix-*` heights | LOW | Fix vars to Base accordion vars |
| action-drawer | `DrawerClose asChild` | MEDIUM | Use Vaul/Base close API correctly |
| alert | Generation gap only | LOW | Optional regenerate |
| alert-dialog | Generation gap | LOW | Optional |
| aspect-ratio | Matches base CSS approach | — | KEEP |
| avatar | Generation gap | LOW | Optional |
| badge | Generation + possible brand tweaks | LOW | KEEP customization |
| breadcrumb | Generation gap | LOW | Optional |
| button | Generation gap (largest visual token surface) | MEDIUM | Align strategy |
| button-group | Generation gap | LOW | Optional |
| calendar | day-picker v10 vs ref v9 risk | MEDIUM | Verify API |
| card | Generation gap | LOW | Optional |
| carousel | OK | — | KEEP |
| carrier-avatar | Moja extension | INFO | KEEP |
| chart | Near parity | — | KEEP |
| checkbox | Generation gap | LOW | Optional |
| collapsible | Generation gap + radix keyframes | LOW | Fix CSS |
| combobox | OK Base UI | LOW | Optional style |
| command | OK cmdk | — | KEEP |
| context-menu | Generation gap | LOW | Optional |
| date-picker | Moja composite using `render` | INFO | KEEP |
| date-time-picker | Moja composite | INFO | KEEP |
| dialog | Generation gap | LOW | Optional |
| direction | OK | — | KEEP |
| drawer | Vaul vs Base drawer; `modal={false}` | HIGH | Migrate or document KEEP |
| dropdown-menu | asChild shim + `as any` | HIGH | Revert shim; type properly |
| empty | Generation gap | LOW | Optional |
| field | Present; apps underuse | MEDIUM | Drive adoption |
| hover-card | Generation gap | LOW | Optional |
| input | Close match | — | KEEP |
| input-group | Generation gap | LOW | Optional |
| input-otp | OK | — | KEEP |
| item | Generation gap | LOW | Optional |
| kbd | OK | — | KEEP |
| label | OK native | — | KEEP |
| menubar | Generation gap | LOW | Optional |
| native-select | OK | — | KEEP |
| navigation-menu | Generation gap | LOW | Optional |
| pagination | Generation gap | LOW | Optional |
| phone-input | `as any`; Moja KEEP | MEDIUM | Improve types |
| popover | Generation gap | LOW | Optional |
| progress | Generation gap | LOW | Optional |
| radio-group | Generation gap | LOW | Optional |
| resizable | OK | — | KEEP |
| scroll-area | Generation gap | LOW | Optional |
| select | Generation gap | LOW | Optional |
| separator | OK | — | KEEP |
| sheet | Generation gap | LOW | Optional |
| sidebar | Generation gap; minor `as any` | LOW–MED | Clean types |
| skeleton | OK | — | KEEP |
| slider | Generation gap | LOW | Optional |
| sonner | OK | — | KEEP |
| spinner | OK | — | KEEP |
| switch | Generation gap | LOW | Optional |
| table | Generation gap | LOW | Optional |
| tabs | Generation gap | LOW | Optional |
| textarea | OK | — | KEEP |
| time-picker | Moja composite | INFO | KEEP |
| toggle | Generation gap | LOW | Optional |
| toggle-group | Generation gap | LOW | Optional |
| tooltip | `as any` | MEDIUM | Restore types |
| user-avatar | Moja extension | INFO | KEEP |

### Missing vs reference (not required)

attachment, bubble, marker, message*, questionnaire, toast component (sonner suffices)
