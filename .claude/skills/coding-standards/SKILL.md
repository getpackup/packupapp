---
name: coding-standards
description: Packup project coding standards, conventions, and architecture reference. Use when referencing coding standards, conducting code reviews, implementing any feature, writing tests, or any time project conventions should inform the work.
---

# Coding Standards

## When this skill applies

Load this skill when:
- Implementing any feature or bug fix
- Conducting a code review
- Writing or updating tests
- Making architectural decisions
- Unsure about project conventions

## Reference documents

- [Dev Commands](dev-commands.md) — how to run, build, typecheck, lint, and test
- [Architecture](architecture.md) — project structure, core technologies, data models, patterns
- [Frontend](frontend.md) — components, styling, responsive design, Radix UI, Tailwind
- [Backend](backend.md) — Firebase (client vs server), auth, data layer, state management
- [Testing](testing.md) — vitest setup, mocking patterns, required mocks, router wrapping
- [Code Style](code-style.md) — comments policy, code quality principles

## Quick reference

**Path alias:** Use `~` for imports from `app/` (e.g. `~/components/Foo`). Exception: `functions/` dir uses relative imports.
**Never mock Firebase directly** — mock at the service layer (`~/services/...`).
**No comments** explaining what code does; only why (when non-obvious).
**Responsive breakpoints:** Use `~/lib/use-screen-size` hook to match Tailwind breakpoints in JS.
**Modals/drawers:** Use `ResponsiveDialogContainer` — renders dialog on desktop, drawer on mobile.
