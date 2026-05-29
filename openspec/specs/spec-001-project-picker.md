---
id: spec-001
title: Project Picker
status: draft
priority: high
---

# Spec-001: Project Picker

## Overview

The homepage of Meridian. Users see a list of discovered OpenSpec workspace projects and pick one to explore. If no projects are found, a helpful empty state guides setup.

## Requirements

1. **R1 — Auto-discover projects**: On load, scan the configured root directory for OpenSpec workspaces using the ADR-002 scanner. Display results as a list of project cards.

2. **R2 — Project card display**: Each card shows:
   - Project name (directory name)
   - Path (abbreviated, e.g., `~/projects/meridian`)
   - Document count by type (e.g., "3 ADRs, 5 specs, 2 TDDs")
   - Last modified timestamp relative (e.g., "2 hours ago")

3. **R3 — Empty state**: When no projects found, show:
   - Brief explanation ("No OpenSpec workspaces found")
   - Link to docs on what an OpenSpec workspace looks like
   - Suggestion to clone or create a project with `/openspec/` dir

4. **R4 — Search/filter**: A text input filters project cards by name or path as user types. No debounce needed — immediate filter on keystroke for small lists.

5. **R5 — Click navigation**: Clicking a project card navigates to `/[project-name]`.

6. **R6 — Responsive**: Cards stack in a single column on narrow viewports, 2-column grid on medium, 3-column on wide.

## Acceptance Criteria

- [x] **AC1**: Loads empty state with guidance when no projects found
- [ ] **AC2**: Shows project cards with name, path, doc counts, and timestamp
- [ ] **AC3**: Typing in search filter narrows visible projects within 100ms
- [ ] **AC4**: Clicking a card navigates to the project page
- [ ] **AC5**: Cards are keyboard-navigable (Tab + Enter)

## Technical Approach

- Route: `/` (already exists with `ProjectPicker` component stub)
- Component: `src/lib/components/ProjectPicker.svelte`
- Data flow: `+page.server.ts` → calls scanner → returns `{ projects: ScannedProject[] }`
- Styling: CSS Grid with `grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))`
- The `ProjectPicker` component exists but is a stub — needs project card rendering, empty state, and search
