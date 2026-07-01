<!-- BEGIN:context-rules -->
# Context and Workspace Rules

This workspace uses Context-Driven Development. Before executing any task:
1. Read the context files in `context/`.
2. Read the active app-level `AGENTS.md` or `CLAUDE.md` in the directory you are working in.
3. Restore the current memory state from `memory.md` at the start of the session.
4. Save memory back to `memory.md` at the end of the session.
5. Follow `context/build-plan.md`, and update `context/progress-tracker.md` and `context/ui-registry.md` as work lands.

When you touch UI, platform, or library-specific code, check the relevant context sections first. Do not invent new structure when the context already defines one.

# Language Rule
- All user interface text, notifications, alerts, tooltips, form fields, and documentation must be written strictly in **English**. Do not use French or any other languages under any circumstances.
<!-- END:context-rules -->
