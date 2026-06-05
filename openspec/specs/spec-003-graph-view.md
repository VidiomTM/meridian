---
id: spec-003
title: Graph View
status: draft
priority: medium
---

# Spec-003: Graph View

## Overview

Interactive visualization of document relationships. Two modes:
- **Force-directed**: Physics simulation showing all documents as nodes with edges for `related`, `part_of`, and `contains` relationships. Nodes are color-coded by status, shaped by kind. Hover highlights connections.
- **Radial**: View centered on a selected document, with all docs distributed on an ellipse and the focus node at center.

## Requirements

1. **R1 — Force-directed layout**: Nodes repel each other. Edges act as springs. Simulation settles to stable layout. Uses Web Workers for 60+ nodes so UI stays responsive; smaller graphs run synchronously.

2. **R2 — Node rendering**: Each document renders as a shape with:
    - Shape varies by kind: rectangles for specs, diamonds for tasks, circles for all others
    - Color-coded by status (fill and stroke)
    - Label visible inside each node (truncated ID prefix)
    - Tooltip with doc title, kind, and status on hover

3. **R3 — Edge rendering**: Lines between nodes with:
    - Solid lines for all edge types (related, part_of, contains)
    - Arrow markers on all edges matching edge kind color
    - Edge color determined by relationship kind (contains, part_of, related)
    - Hover highlights connected edges and dims others

4. **R4 — Interaction**: 
    - Scroll to zoom (SVG viewBox)
    - Click a node to navigate to that document
    - Hover a node to highlight its connections and dim others

5. **R5 — Radial view mode**: Toggle button switches from force-directed to radial. Radial layout distributes nodes on an ellipse with the focus node centered. Layout is computed by the force simulation module's radial path (simple elliptical distribution).

6. **R6 — Legend**: Always-visible overlay showing node shape mapping, edge kind colors, and status color scheme.

7. **R7 — Performance**: Graphs with fewer than 60 nodes run simulation synchronously. 60+ nodes dispatch to a Web Worker. SVG-based rendering for all graph sizes.

## Acceptance Criteria

- [ ] **AC1**: Force-directed layout stabilizes within configured iteration/alpha cutoff for <60 nodes
- [ ] **AC2**: Nodes are rendered with kind-specific shapes (rect=spec, diamond=tasks, circle=others) and status-coded colors
- [ ] **AC3**: Hovering a node highlights its connections and dims others
- [ ] **AC4**: Clicking a node navigates to that document
- [ ] **AC5**: Radial view places the focus node at center with other nodes distributed on an ellipse
- [ ] **AC6**: Legend is always visible showing node shapes (including tasks/diamond), edge kinds, and status colors
- [ ] **AC7**: Web Worker handles simulation for 60+ nodes without blocking main thread

## Technical Approach

- Simulation: `src/lib/meridian/force-sim.ts` (exists, custom physics with repulsion/attraction/center-gravity)
- Worker: `src/lib/meridian/force-sim.worker.ts` (exists, Web Worker wrapper)
- Rendering: SVG in `GraphView.svelte` Svelte 5 component with `$derived` for positions and `$effect` for recomputation
- Component: `src/lib/components/GraphView.svelte` (exists, renders modal overlay with SVG canvas)
- Radial layout: Simple elliptical distribution with focus node centered (via `force-sim.ts` radial path)
- Graph data: Built from `relations.ts` `buildGraph()` producing `GraphNode[]` and `GraphEdge[]`
- Lazy-loaded via dynamic import in `+layout.svelte` when graph modal first opened
