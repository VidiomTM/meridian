---
id: spec-002
title: Document Viewer with Cross-References
status: draft
priority: high
---

# Spec-002: Document Viewer with Cross-References

## Overview

The core reading experience. Users view rendered markdown documents (ADRs, specs, TDDs, designs) with a sidebar showing related documents, composition hierarchy, and external links. Internal cross-references (`[ref-id]`) are hyperlinked for navigation within the same project.

## Requirements

1. **R1 — Markdown rendering**: Render document body as styled HTML. Support:
   - Headings (h1-h6), paragraphs, lists, blockquotes
   - Code blocks with syntax highlighting via CSS classes
   - Tables with zebra striping
   - Images (constrained to content width)
   - Horizontal rules

2. **R2 — Frontmatter display**: Show document metadata in an eyebrow/header area:
   - ID, title, kind (with colored badge), status, date, authors
   - Tags as small pills below the header

3. **R3 — Cross-reference links**: Any text matching `[doc-id]` or `[doc-id#section]` in the document body becomes a clickable link to `/[project]/[doc-id]`. Links to non-existent docs show a muted/dead-link style.

4. **R4 — Relations sidebar**: Right sidebar showing:
   - **Related docs**: Documents listed in the `related` frontmatter field
   - **Parent doc**: If `part_of` is set, show a backlink to the parent
   - **Child docs**: Documents whose `part_of` points to this doc (inverse index)
   - **External links**: From `external` frontmatter field (GitHub, docs, etc.)

5. **R5 — Navigation within relations**: Clicking any relation navigates in-page (no full reload) using SvelteKit's `goto`.

6. **R6 — History navigation**: Browser back/forward works for doc navigation within a project.

7. **R7 — Keyboard shortcuts**:
   - `g` → open graph view for current doc
   - `h` → open history timeline
   - `Escape` → clear search/close overlay

## Acceptance Criteria

- [ ] **AC1**: Markdown body renders with correct heading hierarchy and styled code blocks
- [ ] **AC2**: Frontmatter badge shows correct kind color (ADR=blue, Spec=green, TDD=orange, etc.)
- [ ] **AC3**: `[adr-001]` in body is a clickable link to the ADR document
- [ ] **AC4**: `[adr-001#decision]` links to the #decision anchor in adr-001
- [ ] **AC5**: Relations sidebar shows related, parent, and child docs correctly
- [ ] **AC6**: Clicking a relation navigates without full page reload
- [ ] **AC7**: Non-existent cross-reference renders as muted/disabled link

## Technical Approach

- Route: `/[project]/[docId]` (exists with `DocView` + `Relations` components)
- Parser: `src/lib/meridian/parser.ts` (exists) — parses frontmatter + markdown body
- Cross-references: Regex `\[([a-zA-Z0-9_-]+)(?:#([a-zA-Z0-9_-]+))?\]` in rendered HTML, replaced with `<a>` tags
- Relations: Built from `corpus.ts` inverted index (`byId` map)
- Layout: CSS Grid with `doc-pane` (main) and `relations-rail` (sidebar)
