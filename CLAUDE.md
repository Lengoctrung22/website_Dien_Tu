# TechGear Pro - LLM Coding Guidelines & Principles
<!-- Derived from Andrej Karpathy's observations on LLM coding pitfalls & best practices -->

This file provides behavioral guidelines to eliminate common LLM coding pitfalls. All AI assistants working on this repository (Antigravity, Claude Code, Cursor, Copilot, etc.) must adhere to these principles.

**Tradeoff:** These guidelines bias toward caution, precision, and simplicity over hasty implementations.

---

## 🧠 Core Principles (Karpathy Guidelines)

### 1. Think Before Coding
**Don't assume. Don't hide confusion. Surface tradeoffs.**
- **State assumptions explicitly**: If any requirement or design detail is ambiguous, ask the user rather than guessing.
- **Present multiple interpretations**: If a prompt can be solved in different ways, outline the options and trade-offs before executing.
- **Push back when warranted**: If there is a significantly simpler or safer architectural approach, suggest it.
- **Stop when confused**: Never pretend to understand broken code or unclear specs. Stop, isolate the uncertainty, and ask.

### 2. Simplicity First
**Minimum code that solves the problem. Nothing speculative.**
- **No features beyond what was asked**: Do not add extra buttons, unused config flags, or "future-proofing" logic.
- **No unnecessary abstractions**: Do not create generic patterns, factories, or abstract classes for code used only once or twice.
- **No speculative flexibility**: Avoid over-configurable architectures unless explicitly requested.
- **No redundant error handling**: Do not catch errors that cannot happen or wrap every single line in try/catch boilerplate.
- **Conciseness**: If 200 lines can be written cleanly in 50 lines, write 50 lines.

### 3. Surgical Changes
**Touch only what you must. Clean up only your own mess.**
- **Do not "improve" adjacent code**: Do not format, reorder, or refactor unrelated functions, comments, or imports.
- **Do not touch working code**: Leave existing business logic alone unless the user task directly targets it.
- **Match existing patterns and style**: Adhere strictly to the existing code style in the file you are modifying.
- **Report, don't delete**: If you spot unrelated dead code or bugs, notify the user instead of secretly removing/modifying them.
- **Clean up orphans**: If your change renders an import, variable, or helper unused, remove it.

### 4. Goal-Driven Execution
**Define success criteria. Loop until verified.**
- Convert open-ended requests into clear, testable success criteria.
- For multi-step tasks, follow a verified cycle:
  1. `[Step]` → verify: `[Check/Test/Build]`
  2. `[Step]` → verify: `[Check/Test/Build]`
- Always verify that code compiles, types pass, and relevant endpoints/components work before declaring a task complete.

---

## 🛒 TechGear Pro - Project-Specific Guidelines

### Architecture & Tech Stack
- **Monorepo Structure**:
  - `backend/`: Node.js + Express + TypeScript + Mongoose ODM (MongoDB).
  - `frontend/`: Next.js 14+ (App Router) + Tailwind CSS + Framer Motion + Zustand + TanStack Query.
- **Root Scripts**:
  - `npm run dev:backend` (Port 5000)
  - `npm run dev:frontend` (Port 3000)
  - `npm run test:verify` (Run backend verification tests)

### Backend Rules
- **Language**: TypeScript strict mode. Ensure type safety across controllers, services, and routes.
- **Inventory & Orders**: 
  - Protect inventory operations with atomic reservations to prevent race conditions / overselling.
  - When orders are cancelled, inventory must be correctly restored.
- **Payment & Security**:
  - VNPAY IPN and Webhooks use HMAC SHA512 signature verification. Do NOT bypass or alter signature verification logic.
  - Never commit `.env` secrets or credentials.

### Frontend Rules
- **Next.js App Router**:
  - Differentiate clearly between Server Components (`page.tsx`) and Client Components (`'use client'`).
  - State management: Use Zustand store for client state (Cart, User session persistence).
  - Data fetching: Use TanStack React Query for server data caching & mutations.
  - Responsive & UI: Use Tailwind CSS with existing dark/light color palette and Framer Motion transitions.

### Verification Checklist
Before finishing any task:
1. `npm --prefix backend run build` (or `tsc --noEmit`) passes without TypeScript errors.
2. `npm --prefix frontend run build` (or `next lint`) passes without breaking existing routes.
3. No unintended diffs in `git status`.
