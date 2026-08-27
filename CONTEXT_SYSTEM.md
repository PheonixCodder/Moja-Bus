# Moja Ride Context-Driven Development (CDD) Ecosystem Protocol

> **Universal Reference Document for AI Agents & Developers**  
> *Every coding agent or developer working in this repository must understand and follow this protocol before writing or modifying any code.*

---

## 1. Executive Summary & Core Principles

Moja Ride is an intercity digital transportation marketplace and operator ERP platform in Côte d'Ivoire. The codebase is a Turborepo + pnpm monorepo containing three apps (`apps/web`, `apps/traveler-app`, `apps/driver-app`) and shared packages (`packages/*`).

This repository operates under **Context-Driven Development (CDD)** — a system where context files are the single source of truth for all architectural decisions, design patterns, third-party integrations, and session memory. AI agents and engineers read context before touching code.

### Core CDD Rules
1. **Context First** — Read the relevant context files before inspecting or changing any code.
2. **Layered Isolation** — Context is scoped hierarchically. Don't load app-specific context for a platform task and vice versa.
3. **Services Hub is Ground Truth** — Every third-party SDK/API is documented in `context/services/`. Never guess method signatures.
4. **Plans Before Code** — For any non-trivial feature, create a plan in `context/plans/` using `/architect` before writing a line of code.
5. **Audits are Temporary** — Create audit folders in `context/audits/` when investigating. Delete them when all findings are resolved.
6. **Memory is Continuous** — `/remember restore` at session start, `/remember save` at session end. Root `memory.md` is the only memory file.

---

## 2. The Context Hierarchy

```
Level 0: Global Platform Context    →  /context/
Level 1: App-Specific Context       →  /apps/[app]/context/
Level 2: Service Documentation      →  /context/services/
Level 3: Active Feature Plans       →  /context/plans/
Level 4: Active Feature Audits      →  /context/audits/
Level 5: Session Memory             →  /memory.md
```

---

## 3. Full Directory Map

### Root
```
moja-buss/
├── CONTEXT_SYSTEM.md        ← You are here. Read this first.
├── AGENTS.md                ← Universal agent rules (all tools)
├── CLAUDE.md                ← Claude-specific entry rules
├── memory.md                ← Active session memory (/remember)
├── README.md                ← Project intro & quick start
├── context/                 ← Master context (Level 0–4)
├── apps/
│   ├── web/
│   │   ├── AGENTS.md
│   │   └── context/         ← Web app-specific context (Level 1)
│   ├── traveler-app/
│   │   ├── AGENTS.md
│   │   └── context/         ← Traveler app-specific context (Level 1)
│   └── driver-app/
│       ├── AGENTS.md
│       └── context/         ← Driver app-specific context (Level 1)
└── packages/                ← Shared: db, schemas, auth, ui, theme, types
```

### `context/` — Full Map
```
context/
├── project-overview.md      ← Platform vision, personas, core flows
├── architecture.md          ← Monorepo topology, DB invariants, data flow
├── build-plan.md            ← Development phases & milestones
├── progress-tracker.md      ← Master completion status (living doc)
├── code-standards.md        ← TypeScript, tRPC, Biome, outbox, naming
├── library-docs.md          ← Project-specific library usage patterns
├── ui-tokens.md             ← Brand colors, typography, spacing tokens
├── ui-rules.md              ← Interaction states, responsive rules, animations
├── ui-registry.md           ← Shared packages/ui component catalog
│
├── domain-specs/            ← Core subsystem architectural specifications
│   ├── auth-and-rbac.md
│   ├── payments-and-escrow.md
│   ├── bank-encryption.md
│   ├── marketing-and-blog.md
│   └── passenger-dashboard-analysis.md
│
├── services/                ← Third-party service documentation hub
│   ├── README.md            ← Service index & ingestion protocol
│   ├── paystack/            ← APIs, webhooks, transfers, mobile money
│   ├── novu/                ← Notification workflows, outbox contracts
│   ├── better-auth/         ← Auth setup, sessions, RBAC
│   └── mapbox-telemetry/    ← GPS, fleet maps, telemetry tokens
│
├── plans/                   ← Active feature implementation plans
│   └── [feature-name].md    ← Created by /architect before building
│
└── audits/                  ← Active feature audits (delete when resolved)
    └── README.md            ← Audit protocol, severity definitions, template
```

---

## 4. Context Discovery — Step by Step

### At the Start of Every Session
1. Run `/remember restore` → reads `memory.md` to restore sprint state.
2. Read `context/architecture.md` for invariants relevant to today's task.

### Before Building a New Feature
1. Run `/architect` → produces a plan saved to `context/plans/[feature].md`.
2. Check the relevant app's `context/overview.md` for routing and component conventions.
3. Check `context/ui-registry.md` or `apps/[app]/context/ui-registry.md` for existing components.

### Before Any Third-Party Integration
1. Read `context/services/[service-name]/index.md` (e.g. `paystack`, `novu`, `better-auth`).
2. Never guess API method names or webhook payload shapes.

### When Working on a Specific App
| App | Read First |
| :--- | :--- |
| `apps/web` | `apps/web/AGENTS.md` → `apps/web/context/overview.md` |
| `apps/traveler-app` | `apps/traveler-app/AGENTS.md` → `apps/traveler-app/context/overview.md` |
| `apps/driver-app` | `apps/driver-app/AGENTS.md` → `apps/driver-app/context/overview.md` |

### When Conducting a Feature Audit
1. Read `context/audits/README.md` for the standard template.
2. Create `context/audits/[feature-name]/` with numbered module files.
3. Track open gaps in `context/progress-tracker.md`.
4. **Delete the audit folder when all findings are resolved.**

### At the End of Every Session
1. Run `/remember save` → writes state to `memory.md`.
2. Update `context/progress-tracker.md` if features landed.
3. Update relevant `ui-registry.md` if new components were built (or run `/imprint`).

---

## 5. Workflow Skills Reference

| Skill | When to Use |
| :--- | :--- |
| `/remember restore` | Start of every session — restores `memory.md` context |
| `/remember save` | End of every session — saves state to `memory.md` |
| `/architect` | Before building any non-trivial feature — produces `context/plans/[feature].md` |
| `/imprint` | After building UI components — updates the relevant `ui-registry.md` |
| `/review` | After completing a feature — verifies against invariants and standards |
| `/recover` | When a build breaks or context has drifted — diagnoses before acting |

---

## 6. Multi-App Scalability

Adding a new app (`apps/[new-app]`) is a 4-step process:
1. Create `apps/[new-app]/context/overview.md` — pages, flows, state patterns.
2. Create `apps/[new-app]/context/ui-registry.md` — local component catalog.
3. Create `apps/[new-app]/AGENTS.md` — context pointers + app-specific rules.
4. Register in `context/architecture.md` (topology) and `context/progress-tracker.md` (roadmap).

---

## 7. Prohibited Practices

> [!CAUTION]
> **Zero Tolerance Rules for AI Agents:**
> 1. **No split memory files** — Root `memory.md` only. Never create `context/memory.md` or similar.
> 2. **No guessing third-party APIs** — Consult `context/services/[service]/` first, always.
> 3. **No raw secrets in context files** — Redact or omit all credentials, tokens, and keys.
> 4. **No direct Novu triggers in request handlers** — Always use the transactional outbox pattern.
> 5. **No undocumented components** — Update `ui-registry.md` after every new reusable component.
> 6. **No stale audit folders** — Delete `context/audits/[feature]/` once all findings are resolved.
> 7. **No code before a plan** — For non-trivial features, run `/architect` and save to `context/plans/` first.
