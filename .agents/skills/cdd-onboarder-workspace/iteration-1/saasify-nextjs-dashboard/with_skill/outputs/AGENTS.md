# Agent Instructions

This repository contains custom agent configurations, instructions, and workspace guidelines.

<!-- BEGIN:context-rules -->
# Context & Workspace Rules

This workspace uses a Context-Driven Development (CDD) system. Before executing any task:
1. **Always read the context files** in the `/context` directory to understand the project architecture, design tokens, code standards, and current progress.
2. **Restore memory** at the start of every session using `/remember restore` (which reads `memory.md` in the root).
3. **Save memory** at the end of every session using `/remember save` to ensure the next session picks up exactly where we left off.
4. **Follow the plan** outlined in `context/build-plan.md` and update `context/progress-tracker.md` and `context/ui-registry.md` as files are built/modified.
<!-- END:context-rules -->
