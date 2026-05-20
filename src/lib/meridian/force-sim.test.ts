import { describe, it, expect } from 'vitest';
import { runForceSim } from './force-sim.js';

describe('runForceSim', () => {
	const ids = ['a', 'b', 'c'];
	const edges = [{ from: 'a', to: 'b', kind: 'related' }];

	it('returns positions for all ids', () => {
		const result = runForceSim({ ids, edges, width: 800, height: 600, layout: 'force' });
		expect(Object.keys(result)).toEqual(['a', 'b', 'c']);
	});

	it('returns positions with x and y', () => {
		const result = runForceSim({ ids, edges, width: 800, height: 600, layout: 'force' });
		for (const pos of Object.values(result)) {
			expect(pos).toHaveProperty('x');
			expect(pos).toHaveProperty('y');
			expect(typeof pos.x).toBe('number');
			expect(typeof pos.y).toBe('number');
		}
	});

	it('radial layout returns positions without simulation', () => {
		const result = runForceSim({ ids, edges, width: 800, height: 600, layout: 'radial' });
		expect(Object.keys(result).length).toBe(3);
	});

	it('radial layout with focusId places focus at center', () => {
		const result = runForceSim({ ids, edges, width: 800, height: 600, layout: 'radial', focusId: 'a' });
		expect(result.a.x).toBe(400);
		expect(result.a.y).toBe(300);
	});

	it('radial layout ignores non-existent focusId', () => {
		const result = runForceSim({ ids, edges, width: 800, height: 600, layout: 'radial', focusId: 'nonexistent' });
		expect(Object.keys(result).length).toBe(3);
		// All nodes should be on the ellipse, not center
		expect(result.a.x).not.toBe(400);
	});

	it('handles empty ids', () => {
		const result = runForceSim({ ids: [], edges: [], width: 800, height: 600, layout: 'force' });
		expect(result).toEqual({});
	});

	it('handles single node', () => {
		const result = runForceSim({ ids: ['a'], edges: [], width: 800, height: 600, layout: 'force' });
		expect(result.a).toBeDefined();
		expect(typeof result.a.x).toBe('number');
	});

	it('skips edges with missing from/to nodes', () => {
		const result = runForceSim({
			ids: ['a', 'b'],
			edges: [{ from: 'nonexistent', to: 'a', kind: 'related' }],
			width: 800,
			height: 600,
			layout: 'force',
			iterations: 10
		});
		expect(Object.keys(result).length).toBe(2);
	});

	it('respects custom iterations', () => {
		const result = runForceSim({ ids, edges, width: 800, height: 600, layout: 'force', iterations: 5 });
		expect(Object.keys(result).length).toBe(3);
	});
});
