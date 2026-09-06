# Graph Report - ui  (2026-09-05)

## Corpus Check
- 71 files · ~16,589 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 587 nodes · 704 edges · 44 communities (36 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c8d93de5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- sidebar.tsx
- button.tsx
- dependencies
- shims.d.ts
- field.tsx
- phone-input.tsx
- menubar.tsx
- package.json
- combobox.tsx
- action-drawer.tsx
- carrier-avatar.tsx
- components.json
- tsconfig.json
- carousel.tsx
- chart.tsx
- navigation-menu.tsx
- empty.tsx
- toggle-group.tsx
- alert.tsx
- tabs.tsx
- native-select.tsx
- badge.tsx
- useMediaQuery
- react-phone-number-input.d.ts

## God Nodes (most connected - your core abstractions)
1. `Button()` - 16 edges
2. `aliases` - 6 edges
3. `tailwind` - 5 edges
4. `exports` - 5 edges
5. `scripts` - 5 edges
6. `useCarousel()` - 5 edges
7. `Popover()` - 5 edges
8. `PopoverTrigger()` - 5 edges
9. `PopoverContent()` - 5 edges
10. `Separator()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Calendar()` --calls--> `buttonVariants`  [EXTRACTED]
  packages/ui/src/components/ui/calendar.tsx → packages/ui/src/components/ui/button.tsx
- `CarrierAvatar()` --calls--> `getCompanyInitials()`  [EXTRACTED]
  packages/ui/src/components/ui/carrier-avatar.tsx → packages/ui/src/lib/initials.ts
- `SidebarProvider()` --calls--> `useIsMobile()`  [EXTRACTED]
  packages/ui/src/components/ui/sidebar.tsx → packages/ui/src/hooks/use-mobile.ts
- `ToggleGroupItem()` --calls--> `toggleVariants`  [EXTRACTED]
  packages/ui/src/components/ui/toggle-group.tsx → packages/ui/src/components/ui/toggle.tsx
- `UserAvatar()` --calls--> `getDicebearGlassUrl()`  [EXTRACTED]
  packages/ui/src/components/ui/user-avatar.tsx → packages/ui/src/lib/initials.ts

## Import Cycles
- None detected.

## Communities (44 total, 8 thin omitted)

### Community 0 - "sidebar.tsx"
Cohesion: 0.06
Nodes (19): Sheet(), SheetContent(), SheetDescription(), SheetHeader(), SheetTitle(), Sidebar(), SidebarContext, SidebarContextProps (+11 more)

### Community 1 - "button.tsx"
Cohesion: 0.08
Nodes (14): Button(), buttonVariants, Calendar(), DatePickerProps, DateTimePickerProps, PaginationLinkProps, Popover(), PopoverContent() (+6 more)

### Community 2 - "dependencies"
Cohesion: 0.05
Nodes (41): @base-ui/react, class-variance-authority, cmdk, cn, date-fns, embla-carousel-react, input-otp, libphonenumber-js (+33 more)

### Community 3 - "shims.d.ts"
Cohesion: 0.05
Nodes (39): @base-ui/react, @base-ui/react/accordion, @base-ui/react/alert-dialog, @base-ui/react/avatar, @base-ui/react/button, @base-ui/react/checkbox, @base-ui/react/collapsible, @base-ui/react/context-menu (+31 more)

### Community 4 - "field.tsx"
Cohesion: 0.07
Nodes (10): ButtonGroup(), buttonGroupVariants, Field(), fieldVariants, Item(), ItemMedia(), itemMediaVariants, itemVariants (+2 more)

### Community 5 - "phone-input.tsx"
Cohesion: 0.08
Nodes (17): Command(), CommandEmpty(), CommandGroup(), CommandInput(), CommandItem(), CommandList(), Dialog(), DialogContent() (+9 more)

### Community 6 - "menubar.tsx"
Cohesion: 0.09
Nodes (13): DropdownMenu(), DropdownMenuContent(), DropdownMenuGroup(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuPortal(), DropdownMenuRadioGroup(), DropdownMenuSeparator() (+5 more)

### Community 7 - "package.json"
Cohesion: 0.06
Nodes (31): @moja/typescript, author, description, devDependencies, @moja/typescript, @types/react, typescript, exports (+23 more)

### Community 8 - "combobox.tsx"
Cohesion: 0.09
Nodes (8): InputGroup(), InputGroupAddon(), inputGroupAddonVariants, InputGroupButton(), inputGroupButtonVariants, InputGroupInput(), Input(), Textarea()

### Community 9 - "action-drawer.tsx"
Cohesion: 0.14
Nodes (13): ActionDrawerProps, Drawer(), DrawerClose(), DrawerContent(), DrawerContext, DrawerContextProps, DrawerDescription(), DrawerFooter() (+5 more)

### Community 10 - "carrier-avatar.tsx"
Cohesion: 0.17
Nodes (13): Avatar(), AvatarFallback(), AvatarImage(), CarrierAvatar(), CarrierAvatarProps, SHAPE_CLASSES, SIZE_CLASSES, SIZE_CLASSES (+5 more)

### Community 11 - "components.json"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+8 more)

### Community 12 - "tsconfig.json"
Cohesion: 0.12
Nodes (16): @moja/typescript/next.json, node_modules, ./src/components/*, src/**/*.d.ts, ./src/hooks/*, ./src/lib/*, src/**/*.ts, compilerOptions (+8 more)

### Community 14 - "carousel.tsx"
Cohesion: 0.19
Nodes (12): CarouselApi, CarouselContent(), CarouselContext, CarouselContextProps, CarouselItem(), CarouselNext(), CarouselOptions, CarouselPlugin (+4 more)

### Community 16 - "chart.tsx"
Cohesion: 0.21
Nodes (10): ChartConfig, ChartContext, ChartContextProps, ChartLegendContent(), ChartTooltipContent(), getPayloadConfigFromPayload(), INITIAL_DIMENSION, THEMES (+2 more)

### Community 22 - "toggle-group.tsx"
Cohesion: 0.43
Nodes (4): ToggleGroupContext, ToggleGroupItem(), Toggle(), toggleVariants

## Knowledge Gaps
- **143 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+138 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Button()` connect `button.tsx` to `sidebar.tsx`, `phone-input.tsx`, `combobox.tsx`, `action-drawer.tsx`, `carousel.tsx`, `alert-dialog.tsx`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `Separator()` connect `field.tsx` to `sidebar.tsx`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _143 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `sidebar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05585106382978723 - nodes in this community are weakly interconnected._
- **Should `button.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08246225319396051 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._