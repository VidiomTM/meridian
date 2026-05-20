import { describe, expect, it } from 'vitest';
import type { DocKind, DocStatus, MeridianDoc } from './format.js';
import type { GraphEdge, GraphNode } from './relations.js';
import { buildGraph, buildInvIndex, runForceSimulation } from './relations.js';

function makeDoc(
	overrides: Partial<MeridianDoc> & { id: string },
): MeridianDoc {
	return {
		kind: 'note' as DocKind,
		title: 'Test',
		status: 'active' as DocStatus,
		date: '',
		authors: [],
		tags: [],
		related: [],
		contains: [],
		part_of: [],
		external: [],
		body: '',
		rawBody: '',
		filePath: '',
		contentType: 'markdown',
		source: 'openspec',
		...overrides,
	};
}

describe('buildInvIndex', () => {
	it('returns empty map for no docs', () => {
		const inv = buildInvIndex([]);
		expect(inv.size).toBe(0);
	});

	it('builds contained_by from contains', () => {
		const docs = [
			makeDoc({ id: 'parent' }),
			makeDoc({ id: 'child', contains: ['parent'] }),
		];
		const inv = buildInvIndex(docs);
		expect(inv.get('parent')?.contained_by).toEqual(['child']);
	});

	it('builds contains_inv from part_of', () => {
		const docs = [
			makeDoc({ id: 'child', part_of: ['parent'] }),
			makeDoc({ id: 'parent' }),
		];
		const inv = buildInvIndex(docs);
		expect(inv.get('parent')?.contains_inv).toEqual(['child']);
	});

	it('builds related_from from related', () => {
		const docs = [makeDoc({ id: 'a', related: ['b'] }), makeDoc({ id: 'b' })];
		const inv = buildInvIndex(docs);
		expect(inv.get('b')?.related_from).toEqual(['a']);
	});

	it('handles multiple docs referencing same target', () => {
		const docs = [
			makeDoc({ id: 'a', contains: ['target'] }),
			makeDoc({ id: 'b', contains: ['target'] }),
		];
		const inv = buildInvIndex(docs);
		expect(inv.get('target')?.contained_by).toEqual(['a', 'b']);
	});
});

describe('buildGraph', () => {
	it('returns empty nodes and edges for empty docs', () => {
		const { nodes, edges } = buildGraph([]);
		expect(nodes).toEqual([]);
		expect(edges).toEqual([]);
	});

	it('creates a node per doc with initial positions', () => {
		const docs = [makeDoc({ id: 'a' }), makeDoc({ id: 'b' })];
		const { nodes } = buildGraph(docs);
		expect(nodes).toHaveLength(2);
		expect(nodes[0].id).toBe('a');
		expect(nodes[0].x).toBeGreaterThan(0);
		expect(nodes[0].y).toBeGreaterThan(0);
	});

	it('creates edges from contains/part_of/related', () => {
		const docs = [
			makeDoc({ id: 'a', contains: ['b'] }),
			makeDoc({ id: 'b', part_of: ['c'] }),
			makeDoc({ id: 'c', related: ['a'] }),
		];
		const { edges } = buildGraph(docs);
		expect(edges).toHaveLength(3);
		expect(edges.find((e) => e.kind === 'contains')).toBeTruthy();
		expect(edges.find((e) => e.kind === 'part_of')).toBeTruthy();
		expect(edges.find((e) => e.kind === 'related')).toBeTruthy();
	});

	it('deduplicates edges with same source, target, and kind', () => {
		// One doc declaring same edge twice
		const docs = [makeDoc({ id: 'a', contains: ['b', 'b'] })];
		const { edges } = buildGraph(docs);
		expect(edges).toHaveLength(1);
	});

	it('skips edges to missing nodes in force simulation', () => {
		const nodes: GraphNode[] = [
			{
				id: 'a',
				kind: 'note',
				status: 'active',
				title: 'A',
				x: 0,
				y: 0,
				vx: 0,
				vy: 0,
			},
		];
		const edges: GraphEdge[] = [
			{ source: 'a', target: 'nonexistent', kind: 'related' },
			{ source: 'nonexistent', target: 'a', kind: 'related' },
		];
		const result = runForceSimulation(nodes, edges, 800, 600, 10);
		expect(result).toHaveLength(1);
	});
});

describe('runForceSimulation', () => {
	it('returns nodes with updated positions', () => {
		const nodes: GraphNode[] = [
			{
				id: 'a',
				kind: 'note',
				status: 'active',
				title: 'A',
				x: 0,
				y: 0,
				vx: 0,
				vy: 0,
			},
			{
				id: 'b',
				kind: 'note',
				status: 'active',
				title: 'B',
				x: 0,
				y: 0,
				vx: 0,
				vy: 0,
			},
		];
		const edges: GraphEdge[] = [{ source: 'a', target: 'b', kind: 'related' }];
		const result = runForceSimulation(nodes, edges, 800, 600, 10);
		expect(result).toHaveLength(2);
		expect(result[0].x).not.toBe(0);
		expect(result[1].x).not.toBe(0);
	});

	it('clamps nodes within bounds', () => {
		const nodes: GraphNode[] = [
			{
				id: 'a',
				kind: 'note',
				status: 'active',
				title: 'A',
				x: 0,
				y: 0,
				vx: 0,
				vy: 0,
			},
		];
		const result = runForceSimulation(nodes, [], 100, 100, 10);
		expect(result[0].x).toBeGreaterThanOrEqual(30);
		expect(result[0].x).toBeLessThanOrEqual(70);
	});

	it('handles single node', () => {
		const nodes: GraphNode[] = [
			{
				id: 'a',
				kind: 'note',
				status: 'active',
				title: 'A',
				x: 0,
				y: 0,
				vx: 0,
				vy: 0,
			},
		];
		const result = runForceSimulation(nodes, [], 800, 600, 10);
		expect(result).toHaveLength(1);
	});
});
