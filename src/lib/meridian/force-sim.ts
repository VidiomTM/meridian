export interface ForceNode { id: string; vx: number; vy: number; x: number; y: number; }
export interface ForceEdge { from: string; to: string; kind: string; }
export interface ForceInput {
  ids: string[];
  edges: ForceEdge[];
  width: number;
  height: number;
  layout: 'force' | 'radial';
  focusId?: string;
  iterations?: number;
}
export type Positions = Record<string, { x: number; y: number }>;

export function runForceSim(input: ForceInput): Positions {
  const { ids, edges, width, height, layout, focusId, iterations = 300 } = input;
  const cx = width / 2;
  const cy = height / 2;

  // Build node list with initial positions
  const nodes: ForceNode[] = ids.map((id, i) => ({
    id,
    x: cx + Math.cos((i / ids.length) * Math.PI * 2) * Math.min(width, height) * 0.35,
    y: cy + Math.sin((i / ids.length) * Math.PI * 2) * Math.min(width, height) * 0.35,
    vx: 0,
    vy: 0,
  }));

  if (layout === 'radial') {
    // Radial layout: distribute on ellipse, focus in center
    nodes.forEach((n, i) => {
      n.x = cx + Math.cos((i / ids.length) * Math.PI * 2) * (width * 0.38);
      n.y = cy + Math.sin((i / ids.length) * Math.PI * 2) * (height * 0.38);
    });
    if (focusId) {
      const fi = nodes.findIndex(n => n.id === focusId);
      if (fi >= 0) {
        nodes[fi].x = cx;
        nodes[fi].y = cy;
      }
    }
    const positions: Positions = {};
    for (const n of nodes) positions[n.id] = { x: n.x, y: n.y };
    return positions;
  }

  // Force simulation
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const alpha = { value: 1 };
  const alphaDecay = 0.0228;
  const velocityDecay = 0.4;

  for (let iter = 0; iter < iterations; iter++) {
    alpha.value *= 1 - alphaDecay;
    if (alpha.value < 0.001) break;
    const a = alpha.value;

    // Repulsion between all nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const ni = nodes[i];
        const nj = nodes[j];
        const dx = ni.x - nj.x;
        const dy = ni.y - nj.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const strength = (800 / (dist * dist)) * a;
        const fx = (dx / dist) * strength;
        const fy = (dy / dist) * strength;
        ni.vx += fx;
        ni.vy += fy;
        nj.vx -= fx;
        nj.vy -= fy;
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const s = nodeMap.get(edge.from);
      const t = nodeMap.get(edge.to);
      if (!s || !t) continue;
      const dx = t.x - s.x;
      const dy = t.y - s.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const targetDist = 120;
      const strength = ((dist - targetDist) / dist) * 0.3 * a;
      const fx = dx * strength;
      const fy = dy * strength;
      s.vx += fx;
      s.vy += fy;
      t.vx -= fx;
      t.vy -= fy;
    }

    // Center gravity
    for (const n of nodes) {
      n.vx += (cx - n.x) * 0.02 * a;
      n.vy += (cy - n.y) * 0.02 * a;
    }

    // Apply velocity
    for (const n of nodes) {
      n.vx *= velocityDecay;
      n.vy *= velocityDecay;
      n.x += n.vx;
      n.y += n.vy;
      n.x = Math.max(30, Math.min(width - 30, n.x));
      n.y = Math.max(30, Math.min(height - 30, n.y));
    }
  }

  const positions: Positions = {};
  for (const n of nodes) positions[n.id] = { x: n.x, y: n.y };
  return positions;
}
