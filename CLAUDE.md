# CLAUDE.md

When reporting information to me, be extremely concise, and sacrifice grammar for the sake of concision.

## Dev commands

How to run the dev server, build, typecheck, lint, and test: see `.claude/skills/coding-standards/dev-commands.md`. Use commands from package.json scripts, not direct CLI commands where possible. Use `pnpm` instead of `npm` or `yarn`. Use `gh` CLI for GitHub operations.

## Coding Standards

All coding standards, architecture conventions, testing guidance, and implementation rules live in the `/coding-standards` skill. Load it for any review, implementation, or standards question.

## Agent Skills

### Issue tracker

Issues live in GitHub Issues for getpackup/packupapp (uses the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
