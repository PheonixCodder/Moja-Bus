# Graphify — Moja Ride Knowledge Graph

**Package**: `graphifyy` (CLI command: `graphify`)
**Output**: `graphify-out/` — committed to git so teammates get the graph on pull.
**Git Hook**: Installed — AST graph auto-rebuilds after every `git commit` (free, no LLM).

---

## Quick Reference

| Task | Command |
| :--- | :--- |
| Build full graph | `graphify .` |
| Update only changed files | `graphify . --update` |
| Answer an architecture question | `graphify query "what connects auth to tRPC?"` |
| Trace how two things relate | `graphify path "NotificationOutbox" "Novu"` |
| Explain a single concept | `graphify explain "operatorProcedure"` |
| Browse in browser | Open `graphify-out/graph.html` |
| Broad architecture overview | Read `graphify-out/GRAPH_REPORT.md` |

> [!IMPORTANT]
> **Always use `graphify query` before reading multiple source files.** The graph returns a scoped subgraph in milliseconds — far faster than grepping or opening files one by one.

---

## Graph Scope (What's Included)

The graph indexes everything **except** what's listed in [`.graphifyignore`](../../.graphifyignore):

**In the graph:**
- All TypeScript/JavaScript source (`apps/`, `packages/`)
- All context and documentation files (`context/`, `AGENTS.md`, `CLAUDE.md`, `CONTEXT_SYSTEM.md`)
- Config files (`turbo.json`, `biome.json`, `tsconfig.base.json`, `compose.yml`, `Dockerfile`)
- Scripts and deploy configs (`scripts/`, `deploy/`)

**Excluded:**
- `node_modules/`, `.next/`, `.expo/`, `dist/`, `build/`, `.turbo/`
- `pnpm-lock.yaml`, `packages/db/migrations/`
- Binary assets (images, fonts, PDFs, map tiles)
- `legacy-apps-setup/`, `app-references/`, `ivory_coast_data/`
- Secrets (`.env`, `google-services.json`)

---

## Installed AI Platform Integrations

| Platform | Files Written | Behavior |
| :--- | :--- | :--- |
| **Antigravity** | `.agents/skills/graphify/SKILL.md` | `/graphify` skill available |
| **Claude Code** | `.claude/skills/graphify/SKILL.md`, `PreToolUse` hook | Auto-queries graph before file reads |
| **OpenCode** | `.opencode/skills/graphify/SKILL.md`, `.opencode/plugins/graphify.js` | `tool.execute.before` hook |
| **Cursor** | `.cursor/rules/graphify.mdc` (alwaysApply: true) | Always-on graph context |

---

## Team Workflow

```
1. git pull               # graphify-out/ comes with it
2. Work on feature        # AST hook rebuilds graph after each commit automatically
3. Doc/service changes?   # Run: graphify . --update
4. graphify-out/ changes  # Commit them — teammates get the fresh graph
```

**Committed files:**
- `graphify-out/graph.json` — the full graph (traversable)
- `graphify-out/GRAPH_REPORT.md` — architecture highlights
- `graphify-out/graph.html` — interactive browser visualization

**Not committed (local only):**
- `graphify-out/cost.json` — per-session API cost tracking
- `graphify-out/cache/` — LLM extraction cache (optional — commit for speed)

---

## Common Query Examples for Moja Ride

```bash
# Architecture questions
graphify query "how does a booking flow from search to payment?"
graphify query "what tRPC routers exist and what do they protect?"
graphify query "where does the notification outbox pattern get triggered?"

# Relationship tracing
graphify path "operatorProcedure" "companyId"
graphify path "DriverProfile" "NotificationOutbox"
graphify path "paystackWebhook" "BookingStatus"

# Deep-diving a concept
graphify explain "mintTelemetryToken"
graphify explain "NotificationOutbox"
graphify explain "adminProcedure"
```

---

## Adding a New Service/Platform Integration

To add graphify for another AI tool (e.g. Gemini CLI):
```bash
graphify install --project --platform gemini
```
Then update the "Installed AI Platform Integrations" table above.
