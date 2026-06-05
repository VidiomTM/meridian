---
id: adr-001
title: Meridian Purpose & Scope
status: accepted
date: 2026-05-20
---

# ADR-001: Meridian Purpose & Scope

## Context

Development teams maintain architecture decisions, specifications, designs, and TDDs as markdown documents in their repositories. These documents are valuable but hard to discover, navigate, and connect. Teams resort to wikis (stale), shared drives (lost), or docs-as-code without a browser (inaccessible to non-devs).

OpenSpec defines a standard layout (`openspec/specs/`, `openspec/adr/`, `openspec/designs/`, `openspec/changes/`) for housing these artifacts alongside code, but no tool exists to *browse* an OpenSpec workspace.

## Decision

Build **Meridian** — a SvelteKit 5 web app that:

1. Scans local filesystem directories for OpenSpec workspace projects
2. Parses markdown documents with frontmatter into structured artifacts
3. Renders them with full cross-reference navigation (related docs, composition, chronology)
4. Provides graph views (force-directed + radial) for exploring relationships
5. Tracks changes as living documents that reflect what's actively being built

Meridian is a **browser with inline editing** — it can edit OpenSpec artifact bodies in-place via the document viewer, but it does not create, delete, or manage documents. It reads what exists, makes it navigable, and allows quick edits to artifact content.

### Non-goals

- Document creation/deletion — use your editor
- Real-time collaboration — use version control
- Authentication/authorization — local-first, single user
- Cloud sync — stateless, reads from local git repos

## Consequences

**Positive:**

- Teams get a visual, navigable view of their decisions and specs at no authoring overhead
- Cross-references become clickable — actual hyperlinks, not grep
- Graph views reveal implicit structure teams didn't know they had
- Changes tracking keeps active work visible alongside spec

**Negative:**

- Requires filesystem access to local clones — not a remote-first tool
- Inline editing is limited to artifact body content — no workflow integration (no "approve this ADR" in-app)
- Markdown parsing fidelity depends on consistent frontmatter conventions

**Neutral:**

- The project is inherently tied to the OpenSpec convention. Workspaces not following OpenSpec layout won't be discoverable without adapter configuration.
