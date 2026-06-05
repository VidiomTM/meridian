---
id: spec-002
title: Document Viewer with Cross-References
status: draft
priority: high
---

# Spec-002: Document Viewer with Cross-References

## Overview

The core reading experience. Users view rendered markdown documents (ADRs, specs, TDDs, designs) with a sidebar showing related documents, composition hierarchy, and external links. Internal cross-references (`{{DOC_ID}}`) are hyperlinked for navigation within the same project.

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

3. **R3 — Cross-reference links**: Any text matching `{{DOC_ID}}` in the document body becomes a clickable link to `/[project]/[DOC_ID]`. IDs are uppercase and may contain alphanumerics, dots, colons, and hyphens. Links to non-existent docs show a muted/dead-link style as `<code class="xref-unknown">`.

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
- [ ] **AC3**: `{{ADR-001}}` in body is a clickable link to the ADR document
- [ ] **AC4**: Cross-reference links render as `<a class="xref-chip">` elements with status badges (no anchor/section linking currently supported)
- [ ] **AC5**: Relations sidebar shows related, parent, and child docs correctly
- [ ] **AC6**: Clicking a relation navigates without full page reload
- [ ] **AC7**: Non-existent cross-reference renders as `<code class="xref-unknown">` (muted inline code)

## Technical Approach

- Route: `/[project]/[docId]` (exists with `DocView` + `Relations` components)
- Parser: `src/lib/meridian/parser.ts` (exists) — parses frontmatter + markdown body
- Cross-references: Regex `/\{\{([A-Z0-9._:-]+)\}\}/g` in rendered HTML, replaced with `<a>` tags
- Relations: Built from `corpus.ts` inverted index (`byId` map)
- Layout: CSS Grid with `doc-pane` (main) and `relations-rail` (sidebar)
