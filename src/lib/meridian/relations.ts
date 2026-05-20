import type { InvEntry, MeridianDoc } from './format.js';

export type InvIndex = Map<string, InvEntry>;

export function buildInvIndex(docs: MeridianDoc[]): InvIndex {
	const inv = new Map<string, InvEntry>();

	const getOrCreate = (id: string): InvEntry => {
		if (!inv.has(id)) {
			inv.set(id, {
				contained_by: [],
				contains_inv: [],
				related_from: [],
			});
		}
		return inv.get(id)!;
	};

	for (const doc of docs) {
		for (const target of doc.contains) {
			getOrCreate(target).contained_by.push(doc.id);
		}
		for (const target of doc.part_of) {
			getOrCreate(target).contains_inv.push(doc.id);
		}
		for (const target of doc.related) {
			getOrCreate(target).related_from.push(doc.id);
		}
	}

	return inv;
}

export interface GraphNode {
	id: string;
	kind: string;
	status: string;
	title: string;
	x: number;
	y: number;
	vx: number;
	vy: number;
}

export interface GraphEdge {
	source: string;
	target: string;
	kind: 'contains' | 'part_of' | 'related';
}

export function buildGraph(docs: MeridianDoc[]): {
	nodes: GraphNode[];
	edges: GraphEdge[];
} {
	const nodes: GraphNode[] = docs.map((doc, i) => ({
		id: doc.id,
		kind: doc.kind,
		status: doc.status,
		title: doc.title,
		x: 400 + Math.cos((i / docs.length) * Math.PI * 2) * 200,
		y: 300 + Math.sin((i / docs.length) * Math.PI * 2) * 200,
		vx: 0,
		vy: 0,
	}));

	const edges: GraphEdge[] = [];
	const edgeSet = new Set<string>();

	const addEdge = (source: string, target: string, kind: GraphEdge['kind']) => {
		const key = `${source}→${target}:${kind}`;
		if (!edgeSet.has(key)) {
			edgeSet.add(key);
			edges.push({ source, target, kind });
		}
	};

	for (const doc of docs) {
		for (const t of doc.contains) addEdge(doc.id, t, 'contains');
		for (const t of doc.part_of) addEdge(doc.id, t, 'part_of');
		for (const t of doc.related) addEdge(doc.id, t, 'related');
	}

	return { nodes, edges };
}

/** Run a deterministic force simulation (browser-safe, no d3) */
export function runForceSimulation(
	nodes: GraphNode[],
	edges: GraphEdge[],
	width: number,
	height: number,
	iterations = 200,
): GraphNode[] {
	const nodeMap = new Map(nodes.map((n) => [n.id, n]));
	const cx = width / 2;
	const cy = height / 2;

	// Initialize positions in a circle
	nodes.forEach((n, i) => {
		n.x =
			cx +
			Math.cos((i / nodes.length) * Math.PI * 2) *
				Math.min(width, height) *
				0.35;
		n.y =
			cy +
			Math.sin((i / nodes.length) * Math.PI * 2) *
				Math.min(width, height) *
				0.35;
		n.vx = 0;
		n.vy = 0;
	});

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
			const s = nodeMap.get(edge.source);
			const t = nodeMap.get(edge.target);
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
			// Clamp to bounds
			n.x = Math.max(30, Math.min(width - 30, n.x));
			n.y = Math.max(30, Math.min(height - 30, n.y));
		}
	}

	return nodes;
}
