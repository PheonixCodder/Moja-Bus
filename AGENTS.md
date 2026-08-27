<!-- BEGIN:context-rules -->
# Context & Workspace Rules (Moja Ride)

This repository operates under **Context-Driven Development (CDD)**. Before writing or modifying any code, every AI agent and developer MUST follow these rules:

1. **Read the Protocol**: Start by reviewing [CONTEXT_SYSTEM.md](./CONTEXT_SYSTEM.md) to understand the full context hierarchy and boundaries.
2. **Session Memory**:
   - **Restore State**: Run `/remember restore` (reads `memory.md`) at the start of every session.
   - **Save State**: Run `/remember save` at the end of every session to persist progress to `memory.md`.
3. **Layered Context Navigation**:
   - For Global Platform / Architecture: Read `context/architecture.md` and `context/code-standards.md`.
   - For App-Specific Work: Read the relevant app context — `apps/web/context/overview.md`, `apps/traveler-app/context/overview.md`, or `apps/driver-app/context/overview.md`.
   - For Third-Party Integrations: Read `context/services/[service-name]/index.md` (e.g. `paystack`, `novu`, `better-auth`, `mapbox-telemetry`).
   - For Domain Specs: Read `context/domain-specs/` (auth, payments, blog, etc.).
   - For Active Audits: Read `context/audits/README.md` for the standard template.
   - For Active Plans: Check `context/plans/` for any existing plan before starting new work.
4. **Workflow Skills**:
   - Use `/architect` before building complex features → saves plan to `context/plans/[feature].md`.
   - Use `/imprint` after building UI components → updates the relevant `ui-registry.md`.
   - Use `/review` to verify code against architectural invariants before marking tasks complete.
   - Use `/recover` when diagnosing unexpected build failures or context drift.

*Do not invent new patterns or structures when the context files already define them.*
<!-- END:context-rules -->
