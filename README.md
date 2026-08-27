# Moja Ride Platform

> Digital transportation infrastructure and two-sided marketplace for intercity bus operators and travelers in Côte d'Ivoire.

---

## 🚀 Overview

Moja Ride connects passengers with intercity bus companies while providing bus operators with a complete enterprise management system (ERP):
- **Aggregator / Operator / Admin Portal** (`apps/web`): Next.js 15, React 19, Tailwind CSS, shadcn/ui, tRPC, Better Auth.
- **Traveler Mobile App** (`apps/traveler-app`): React Native, Expo Router, NativeWind.
- **Driver Mobile App** (`apps/driver-app`): React Native, Expo Router, NativeWind, Background Telemetry, Offline QR Scanner.
- **Shared Packages** (`packages/*`): Database (Prisma), Authentication, UI Components, Schemas (Zod), Types, Configs.

---

## 📚 Context-Driven Development (CDD)

This repository strictly uses **Context-Driven Development (CDD)** to maintain zero-hallucination agentic development and high architectural integrity.

**Before contributing or running AI agents, read the official guide:**
👉 **[CONTEXT_SYSTEM.md](./CONTEXT_SYSTEM.md)**

---

## 🛠️ Quick Start

```bash
# Install dependencies
pnpm install

# Run database migrations
pnpm --filter @repo/db migrate:dev

# Start development servers
pnpm dev

# Run typechecks and test suites
pnpm run typecheck
pnpm run test
```