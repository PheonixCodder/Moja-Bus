<!-- BEGIN:context-rules -->
# Context & Workspace Rules (Moja Ride)

This repository operates under **Context-Driven Development (CDD)**.

Before executing any task:
1. Review [CONTEXT_SYSTEM.md](./CONTEXT_SYSTEM.md) for ecosystem protocols.
2. Read the active app-level context or global context in `context/`.
3. Restore memory state from `memory.md` at session start.
4. Save updated memory back to `memory.md` at session end.
5. Follow `context/build-plan.md`, `context/progress-tracker.md`, and relevant `ui-registry.md` files.

*See [AGENTS.md](./AGENTS.md) and [CONTEXT_SYSTEM.md](./CONTEXT_SYSTEM.md) for complete instructions.*
<!-- END:context-rules -->

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
