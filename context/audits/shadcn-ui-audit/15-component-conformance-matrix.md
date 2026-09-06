# 15 — Component Conformance Matrix

Reference column = `registry/bases/base/ui` unless noted. Config claims radix-nova but code tracks **base**.

| Component | Reference primitive | Our primitive | API Match | Styling Match | A11y | Customization | Verdict |
|-----------|---------------------|---------------|-----------|---------------|------|---------------|---------|
| accordion | @base-ui accordion | same | High | Low (gen) | OK* | gen | MODERATE |
| action-drawer | n/a | Vaul composite | — | — | Risk asChild | Moja | MODERATE |
| alert | none | none | High | Low | OK | gen | MINOR |
| alert-dialog | @base-ui | same | High | Low | OK* | gen | MINOR |
| aspect-ratio | CSS | CSS | High | High | OK | — | PASS |
| avatar | @base-ui | same | High | Low | OK | gen | MINOR |
| badge | useRender | same | High | Low | OK | gen/brand | PASS+CUSTOM |
| breadcrumb | useRender | same | High | Low | OK | gen | MINOR |
| button | @base-ui button | same | High | **Low** | OK | gen | MODERATE |
| button-group | useRender | same | High | Low | OK | gen | MINOR |
| calendar | day-picker | day-picker | Med (v skew) | — | OK | — | MINOR |
| card | none | none | High | Low | OK | gen | MINOR |
| carousel | embla | embla | High | — | OK | — | PASS |
| carrier-avatar | n/a | custom | — | — | OK | KEEP | PASS+CUSTOM |
| chart | recharts wrap | same | High | High | Limited | brand colors | PASS |
| checkbox | @base-ui | same | High | Low | OK | gen | MINOR |
| collapsible | @base-ui | same | High | Low | OK* | gen+CSS | MINOR |
| combobox | @base-ui | same | High | Low | OK* | gen | MINOR |
| command | cmdk | cmdk | High | — | OK* | — | PASS |
| context-menu | @base-ui | same | High | Low | OK* | gen | MINOR |
| date-picker | docs composite | composite | — | — | OK* | KEEP | PASS+CUSTOM |
| date-time-picker | n/a | composite | — | — | OK* | KEEP | PASS+CUSTOM |
| dialog | @base-ui | same | High | Low | OK* | gen | MINOR |
| direction | @base-ui | same | High | — | OK | — | PASS |
| drawer | **@base-ui drawer** | **@base-ui drawer** | High | style-nova | Aligned | migrated | **OK** (cn-* + Moja modal=false) |
| dropdown-menu | @base-ui menu | same+shim | **Low** | Low | Risk | shim | **MAJOR** |
| empty | none | none | High | Low | OK | gen | MINOR |
| field | none/structure | same | High | Low | OK | gen | MINOR |
| hover-card | preview-card | same | High | Low | OK | gen | MINOR |
| input | @base-ui input | same | High | High | OK | — | PASS |
| input-group | none | none | High | Low | OK | gen | MINOR |
| input-otp | input-otp | same | High | — | OK | — | PASS |
| item | useRender | same | High | Low | OK | gen | MINOR |
| kbd | none | none | High | — | OK | — | PASS |
| label | native | native | High | High | OK | — | PASS |
| menubar | @base-ui | same | High | Low | OK* | gen | MINOR |
| native-select | native | native | High | — | OK | — | PASS |
| navigation-menu | @base-ui | same | High | Low | OK* | gen | MINOR |
| pagination | none | none | High | Low | OK | gen | MINOR |
| phone-input | n/a | custom | — | — | OK* | KEEP+types | MODERATE |
| popover | @base-ui | same | High | Low | OK* | gen | MINOR |
| progress | @base-ui | same | High | Low | OK | gen | MINOR |
| radio-group | @base-ui | same | High | Low | OK | gen | MINOR |
| resizable | panels | same | High | — | OK | — | PASS |
| scroll-area | @base-ui | same | High | Low | OK | gen | MINOR |
| select | @base-ui | same | High | Low | OK* | gen | MINOR |
| separator | @base-ui | same | High | High | OK | — | PASS |
| sheet | @base-ui dialog | same | High | Low | OK* | gen | MINOR |
| sidebar | useRender | same | High | Low | OK* | gen | MINOR |
| skeleton | none | none | High | — | OK | — | PASS |
| slider | @base-ui | same | High | Low | OK | gen | MINOR |
| sonner | sonner | sonner | High | — | OK | — | PASS |
| spinner | none | none | High | — | OK | — | PASS |
| switch | @base-ui | same | High | Low | OK | gen | MINOR |
| table | none | none | High | Low | OK | gen | MINOR |
| tabs | @base-ui | same | High | Low | OK | gen | MINOR |
| textarea | native | native | High | High | OK | — | PASS |
| time-picker | n/a | composite | — | — | OK* | KEEP | PASS+CUSTOM |
| toggle | @base-ui | same | High | Low | OK | gen | MINOR |
| toggle-group | @base-ui | same | High | Low | OK | gen | MINOR |
| tooltip | @base-ui | same+any | Med | Low | Risk | types | MODERATE |
| user-avatar | n/a | custom | — | — | OK | KEEP | PASS+CUSTOM |

\* Static inference only — runtime keyboard **NOT VERIFIED**.

**Styling Match “Low (gen)”** = same visual intent likely, wrong generation vs pinned `cn-*` reference.
