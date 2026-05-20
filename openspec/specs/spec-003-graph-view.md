---
id: spec-003
title: Graph View
status: draft
priority: medium
---

# Spec-003: Graph View

## Overview

Interactive visualization of document relationships. Two modes:
- **Force-directed**: Physics simulation showing all documents as nodes with edges for `related`, `part_of`, and `contains` relationships. User can drag nodes, zoom/pan.
- **Radial**: Ego-centric view centered on a selected document, with related docs arranged in concentric rings by relationship type.

## Requirements

1. **R1 — Force-directed layout**: Nodes repel each other. Edges act as springs. Simulation settles to stable layout. Uses Web Workers for simulation so UI stays responsive.

2. **R2 — Node rendering**: Each document renders as a circle with:
   - Color-coded by kind (same scheme as doc viewer badges)
   - Size proportional to number of connections (degree centrality)
   - Label visible on hover (or always for <15 nodes)
   - Tooltip with doc title, kind, and status on hover

3. **R3 — Edge rendering**: Lines between nodes with:
   - Solid line for `related` edges
   - Dashed line for `part_of`/`contains` hierarchical edges
   - Arrow on `part_of` edge pointing from child to parent
   - Edge color matches source node kind

4. **R4 — Interaction**: 
   - Drag nodes to rearrange
   - Scroll to zoom
   - Click-drag on background to pan
   - Click a node to navigate to that document
   - Double-click a node to center the radial view on it

5. **R5 — Radial view mode**: Toggle button switches from force-directed to radial. Current document at center. First ring = directly related docs. Second ring = docs related to those. Relationship type determines ring position.

6. **R6 — Legend**: Overlay showing kind color mapping. Toggle visibility with `l` key.

7. **R7 — Performance**: Graphs with up to 200 nodes render at 60fps. Web Worker handles force simulation. Canvas-based rendering (not SVG) for large graphs.

## Acceptance Criteria

- [ ] **AC1**: Force-directed layout stabilizes within 2 seconds for <50 nodes
- [ ] **AC2**: Nodes are color-coded by doc kind matching the doc viewer scheme
- [ ] **AC3**: Dragging a node moves it and simulation adjusts
- [ ] **AC4**: Clicking a node navigates to that document
- [ ] **AC5**: Radial view correctly places immediate relations in inner ring
- [ ] **AC6**: Legend toggles with `l` key
- [ ] **AC7**: Web Worker simulation doesn't block main thread

## Technical Approach

- Simulation: `src/lib/meridian/force-sim.ts` (exists, uses d3-force-like physics)
- Worker: `src/lib/meridian/force-sim.worker.ts` (exists, Web Worker wrapper)
- Rendering: HTML5 Canvas in a Svelte 5 component with `$effect` for render loop
- Component: `src/lib/components/GraphView.svelte` (to be built)
- Radial layout: Compute concentric rings by BFS from center node, assign positions by angle
- View wrapper: `src/lib/components/GraphModal.svelte` for full-screen overlay triggered by keyboard shortcut or toolbar button
