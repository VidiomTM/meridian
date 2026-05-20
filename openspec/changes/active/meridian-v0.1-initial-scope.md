---
id: change-001
title: Meridian v0.1 — Initial Scope
status: active
started: 2026-05-20
target: 2026-06-03
---

# Change: Meridian v0.1 — Initial Scope

## Summary

Build the initial Meridian application: a browsable OpenSpec workspace viewer with project discovery, document rendering with cross-references, and graph visualization.

## Scope

### In scope

| Artifact | Description | Status |
|----------|-------------|--------|
| ADR-001 | Meridian Purpose & Scope | `accepted` |
| ADR-002 | Monorepo Workspace Scanner | `accepted` |
| Spec-001 | Project Picker | `draft` |
| Spec-002 | Document Viewer with Cross-References | `draft` |
| Spec-003 | Graph View | `draft` |

### Out of scope

- Authentication/authorization
- Document creation/editing
- Real-time collaboration
- Cloud sync
- Remote repository support (GitHub/GitLab API)

## Milestones

1. **M1 — Scaffold**: SvelteKit 5 project, Vitest + Playwright, CI/CD, styling foundation (COMPLETE)
2. **M2 — Project discovery**: Scanner + ProjectPicker component with search and empty state
3. **M3 — Document reading**: Corpus parser, markdown renderer, frontmatter extraction
4. **M4 — Cross-references**: Relations sidebar, in-text link resolution, navigation
5. **M5 — Graph view**: Force-directed + radial layouts via Canvas + Web Worker
6. **M6 — Polish**: Keyboard shortcuts, responsive design, performance tuning

## Dependencies

- SvelteKit 5 (latest)
- Zod (document validation — exists)
- Web Workers (force simulation — exists)
- Canvas API (graph rendering)

## Risks

- **Risk**: Large monorepo with thousands of directories causes slow scan
  - **Mitigation**: Exclude filters + defer perf optimization to post-v0.1
- **Risk**: Markdown parsing edge cases (tables, code blocks with frontmatter-looking content)
  - **Mitigation**: Use frontmatter extraction before markdown render; test against real OpenSpec workspaces
- **Risk**: Force-directed layout performance on large graphs
  - **Mitigation**: Web Worker simulation + Canvas rendering; limit to 200 nodes in v0.1
