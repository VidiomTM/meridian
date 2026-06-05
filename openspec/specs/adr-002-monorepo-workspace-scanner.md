---
id: adr-002
title: Monorepo Workspace Scanner
status: accepted
date: 2026-05-20
---

# ADR-002: Monorepo Workspace Scanner

## Context

Meridian must discover projects that contain OpenSpec workspaces. In a monorepo, individual packages or apps may each have their own `openspec/` directory, or there may be a single root-level `openspec/`. Meridian needs to find them all and present them as browsable projects.

The naive approach would be to require a config file listing every project path. But that creates manual overhead and drift between what exists and what's configured.

## Decision

Meridian uses a **recursive filesystem scanner** that:

1. Accepts a root directory (defaults to `MERIDIAN_ROOT` env var, falling back to `/Users/jonathangadeaharder/projects`) on startup
2. Recursively searches for directories containing an `openspec/` subdirectory
3. Each `openspec/` directory is a **workspace** → shown as a project
4. If the root itself contains `openspec/`, it's included as a project
5. The scanner respects `**/node_modules`, `**/.git`, `**/.next`, `**/build`, `**/dist`, and `**/.svelte-kit` as excluded paths
6. Results are sorted by most recently modified `openspec/` directory (touching a spec updates the project's position)
7. Results are cached with a 1-second TTL — scan on first load, then serve from cache within the TTL window. Full re-scan occurs after expiry or on force reload.

### Project identity

- **Project name**: The parent directory name (e.g., `meridian`)
- **Project path**: Absolute filesystem path
- **Workspace path**: `<project-path>/openspec/`
- **Last modified**: `stat` on the `openspec/` directory mtime
- **Doc count**: Computed during scan by globbing `openspec/specs/*.md`, `openspec/adr/*.md`, etc.

## Consequences

**Positive:**

- Zero config — point Meridian at a root, it finds everything
- Self-updating — new projects appear automatically when you clone them
- Monorepo-friendly — works for both root-level and per-package workspaces

**Negative:**

- Recursive scan on first load is O(n) in directory count. Mitigated by exclude filters and 1-second cache.
- If a directory tree has thousands of exclusions, scan may be slow. Optimize later.
- Project name derived from directory name may be ambiguous (e.g., two repos both named `frontend`).
