---
name: cdd-onboarder
description: Sets up a comprehensive Context-Driven Development (CDD) context system for a new project. Interviews the user to gather essential details, generates 9 markdown files in a /context folder, and integrates context-supporting workflow skills (/architect, /imprint, /recover, /remember, /review). Make sure to trigger this skill whenever the user mentions initializing a project, setting up context files, starting a new build, or onboarding to a codebase.
---

# Context-Driven Development Onboarder (cdd-onboarder)

This skill guides you through onboarding a new project under the **Context-Driven Development (CDD)** framework. It interviews the user, drafts 9 core context files in the `context/` directory, and sets up rules in `AGENTS.md` and/or `CLAUDE.md` to ensure your AI agents read the context files and respect the workspace's state and workflow.

---

## How to Invoke

To begin project onboarding, run:
```
/cdd-onboarder
```

---

## Step 1 — The Onboarding Interview

When invoked, the skill MUST ask the user questions to gather all details needed to populate the context files. Do not guess or assume answers. If the user does not provide certain answers, prompt them or suggest logical defaults based on standard stacks, but require confirmation.

Ask the user:
1. **Project Identity**: What is the name of the app? What does it do? Who is it for (target audience)? What core problem does it solve?
2. **Pages & Navigation**: What are the main pages/views, their routes, and how does navigation work (sidebar, navbar, footer)?
3. **Core User Flow**: Walk through the step-by-step user journey from landing page to core utility.
4. **Tech Stack & Architecture**: What is the main tech stack (e.g., Next.js, React, Tailwind, Supabase, Prisma, PostgreSQL)? What is the folder structure pattern? What are the absolute architectural boundaries or rules (invariants) that must not be broken?
5. **Third-Party Libraries**: What third-party services/APIs are used (e.g., Stripe, PostHog, SendGrid, Browserbase)? How should their clients and servers be separated or initialized?
6. **Design System & Styling**: What are the brand colors, styling framework (e.g., Tailwind, Vanilla CSS), dark/light mode standards, fonts, spacing values, and border radii?
7. **Development Phases**: What are the phases of the build plan? Break down the project into logical feature increments (e.g., Phase 1: Authentication & Database, Phase 2: Core Dashboard, etc.).

---

## Step 2 — Create the 9 Context Files

Once the information is collected, create a `context/` directory in the project root and populate these 9 files:

### 1. `context/project-overview.md`
Describes the project's purpose, problem solved, user personas, main pages, and core flow.
```markdown
# Project Overview

## About the Project
[Description of what the project is, its name, and its primary goals]

## The Problem It Solves
[Detail the core problems this application addresses and the value it provides]

## Pages
```
[Route] -> [Brief description of page UI and purpose]
```

## Navigation
[Overview of navigation components, e.g., Top navbar, side drawers, footer links]

## Core User Flow
[Step-by-step description of the user journey]
```

### 2. `context/architecture.md`
Documents the system patterns, folder structures, data models/schema, and architectural rules.
```markdown
# Architecture

## Tech Stack
[List of languages, frameworks, runtime, styling, and databases]

## Folder Structure
[Diagram or text layout of directory structure and naming conventions]

## Data Models
[Outline of tables, columns, relations, schema, or TypeScript interfaces]

## Architectural Invariants
[Crucial rules that must never be violated, e.g., "Never query the DB directly from a Client Component", "Always scope queries to user_id"]
```

### 3. `context/build-plan.md`
Delineates how features will be built, highlighting the core principle of visual-first mock-ups followed by functional wiring.
```markdown
# Build Plan

## Core Principle
Full page UI built with mock data first — verified visually before any logic is written. Then functionality is built and wired to the UI step by step. Every feature must be visible and testable before moving to the next. No invisible backend phases.

---

## Development Phases
[Breakdown of development phases with numbered checklist items, e.g.]

### Phase 1 — Foundation
- [ ] 01 Database Schema & Migration
- [ ] 02 Authentication Setup
- [ ] 03 Navigation & Shell Layout

### Phase 2 — Core Features
- [ ] 04 ...

---

## Feature Count
[Total count of checklist items per phase]
```

### 4. `context/code-standards.md`
Outlines styling, naming, structure, linting, and formatting rules.
```markdown
# Code Standards

## Styling & Framework Conventions
[Conventions for formatting, e.g., functional components, Hooks, tailwind utility organization]

## Naming Conventions
- Components: PascalCase
- Utilities & Actions: camelCase
- DB Tables & Columns: snake_case

## Rules & Patterns
[TypeScript rules, error handling guidelines, logging systems]
```

### 5. `context/library-docs.md`
Documents project-specific usage rules and client/server contexts for third-party libraries.
```markdown
# Library Docs

Project-specific usage patterns for every third-party library in this project. This file only covers how we use each library in this specific project — rules, patterns, and constraints.

Read the relevant section before implementing any feature that touches these libraries.

---

## [Library Name]
[Client vs Server usage, initialization boilerplate, db query examples, helper rules]
```

### 6. `context/ui-tokens.md`
Documents the design system values.
```markdown
# UI Tokens

## Colors
[Primary, secondary, neutral, accents, dark/light mode tokens]

## Typography
[Fonts, weight values, font sizes]

## Spacing & Layout
[Paddings, margins, grid gaps, container widths]

## Borders & Radius
[Border sizes, border radii tokens]
```

### 7. `context/ui-rules.md`
Defines layout behaviors, interactions, active states, and guidelines.
```markdown
# UI Rules

## Global Layout Rules
[Responsive breakpoints, mobile-first vs desktop-first details]

## Interaction & States
[Hover states, focus ring requirements, disabled and active button styles]

## Animations & Transitions
[Guidelines for slide-ins, fade-ins, micro-animations, timing standards]
```

### 8. `context/ui-registry.md`
Catalog of built components to reference and match for visual consistency.
```markdown
# UI Registry

Living document. Updated after every component is built. Read this before building any new component — match existing patterns exactly before inventing new ones.

---

## How to Use
Before building any component:
1. Check if a similar component already exists here
2. If yes — match its exact classes
3. If no — build it following ui-rules.md and ui-tokens.md, then add it here

After building any component — update this file with the component name, file path, and exact classes used.

---

## Components
_Empty. Components will be added here as they are built._
```

### 9. `context/progress-tracker.md`
The tracking document to ensure state persistence across sessions.
```markdown
# Progress Tracker

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status
**Phase:** [e.g., Phase 1]
**Last completed:** [e.g., Initial database schema setup]
**Next:** [e.g., Home Page UI]

---

## Progress
[Synchronize with Phase checklists in context/build-plan.md]

---

## Decisions Made During Build
_Add decisions here as they are made during implementation._

---

## Notes
_Add notes here as the build progresses — workarounds, patterns, anything that differs from the context files._
```

---

## Step 3 — AGENTS.md / CLAUDE.md Instructions Integration

To ensure coding agents automatically look at this context, create or modify `AGENTS.md` and `CLAUDE.md` in the project root with the following instructions:

```markdown
<!-- BEGIN:context-rules -->
# Context & Workspace Rules

This workspace uses a Context-Driven Development (CDD) system. Before executing any task:
1. **Always read the context files** in the `/context` directory to understand the project architecture, design tokens, code standards, and current progress.
2. **Restore memory** at the start of every session using `/remember restore` (which reads `memory.md` in the root).
3. **Save memory** at the end of every session using `/remember save` to ensure the next session picks up exactly where we left off.
4. **Follow the plan** outlined in `context/build-plan.md` and update `context/progress-tracker.md` and `context/ui-registry.md` as files are built/modified.
<!-- END:context-rules -->
```

---

## Step 4 — Orchestrate Context-Aware Skills

Once onboarding is completed, present the user with a summary of the context setup and instruct them on how they (and their AI assistant) will utilize the other custom skills:

1. **`/architect`**: Invoke this at the start of any new feature. It prompts the assistant to think through architectural decisions and draft a clear implementation plan before writing any code.
2. **`/imprint`**: Invoke this immediately after building any UI component to capture its classes and visual properties in `context/ui-registry.md`, maintaining strict visual consistency.
3. **`/recover`**: Invoke this when hitting build failures, runtime exceptions, or agent loop drift. It diagnoses whether the issue is a targeted bug, a polluted context session (requiring a hard reset), or a flawed architectural assumption (requiring a rethink).
4. **`/remember`**: Run `/remember save` at the end of a coding session and `/remember restore` at the start of a new one to preserve context state in `memory.md`.
5. **`/review`**: Run this after building a feature to verify correctness against the plan, architecture invariants, design systems, and code standards.
