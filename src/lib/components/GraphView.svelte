<script lang="ts">
	import { onMount } from 'svelte';
	import type { MeridianDoc } from '$lib/meridian/format.js';
	import { buildGraph } from '$lib/meridian/relations.js';
	import type { GraphNode, GraphEdge } from '$lib/meridian/relations.js';
	import { REL_COLORS } from '$lib/meridian/format.js';
	import StatusChip from './StatusChip.svelte';
	import { trapFocus } from '$lib/a11y/trap-focus.js';
	import { runForceSim } from '$lib/meridian/force-sim.js';
	import type { Positions, ForceEdge } from '$lib/meridian/force-sim.js';
	import ForceWorker from '$lib/meridian/force-sim.worker.ts?worker';

	let {
		docs,
		focusId = null,
		onclose,
		onnavigate
	}: {
		docs: MeridianDoc[];
		focusId?: string | null;
		onclose: () => void;
		onnavigate: (id: string) => void;
	} = $props();

	const W = 740;
	const H = 480;

	let edges = $state<GraphEdge[]>([]);
	let layout = $state<'force' | 'radial'>('force');
	let hoverId = $state<string | null>(null);
	let hoverPos = $state<{ x: number; y: number }>({ x: 0, y: 0 });
	let positions = $state<Positions>({});
	let computing = $state(false);
	let activeWorker: Worker | null = null;

	const statusFill: Record<string, string> = {
		active: '#f0e0bd',
		canonical: '#d8e3d3',
		archived: '#d8d1c4',
		legacy: '#e3ddcf'
	};
	const statusStroke: Record<string, string> = {
		active: '#b88820',
		canonical: '#4a7b3f',
		archived: '#8a8270',
		legacy: '#8a8270'
	};

	// Build nodes list from positions for rendering
	const nodes = $derived(
		docs.map((doc) => ({
			id: doc.id,
			kind: doc.kind,
			status: doc.status,
			title: doc.title,
			x: positions[doc.id]?.x ?? W / 2,
			y: positions[doc.id]?.y ?? H / 2,
		}))
	);

	function computePositions(currentLayout: string) {
		const { nodes: ns, edges: es } = buildGraph(docs);
		edges = es;
		const forceEdges: ForceEdge[] = es.map(e => ({ from: e.source, to: e.target, kind: e.kind }));
		const ids = docs.map(d => d.id);

		if (ids.length < 60) {
			positions = runForceSim({ ids, edges: forceEdges, width: W, height: H, layout: currentLayout as 'force' | 'radial', focusId: focusId ?? undefined, iterations: 300 });
			return;
		}
		computing = true;
		if (activeWorker) activeWorker.terminate();
		activeWorker = new ForceWorker();
		activeWorker.onmessage = (e: MessageEvent) => {
			positions = e.data;
			computing = false;
		};
		activeWorker.postMessage({ ids, edges: forceEdges, width: W, height: H, layout: currentLayout, focusId: focusId ?? undefined, iterations: 300 });
	}

	onMount(() => {
		computePositions(layout);
	});

	$effect(() => {
		computePositions(layout);
		return () => activeWorker?.terminate();
	});

	const nodeMap = $derived(new Map(nodes.map((n) => [n.id, n])));

	function getNeighbours(id: string): Set<string> {
		const s = new Set<string>();
		for (const e of edges) {
			if (e.source === id) s.add(e.target);
			if (e.target === id) s.add(e.source);
		}
		return s;
	}

	function nodeOpacity(id: string): number {
		if (!hoverId) return 1;
		if (id === hoverId) return 1;
		if (getNeighbours(hoverId).has(id)) return 0.9;
		return 0.15;
	}

	function edgeOpacity(e: GraphEdge): number {
		if (!hoverId) return 0.55;
		if (e.source === hoverId || e.target === hoverId) return 1;
		return 0.05;
	}

	function handleNodeHover(id: string, e: MouseEvent) {
		hoverId = id;
		hoverPos = { x: e.offsetX + 12, y: e.offsetY + 12 };
	}

	function handleMouseLeave() {
		hoverId = null;
	}

	const hoverDoc = $derived(hoverId ? docs.find((d) => d.id === hoverId) : null);

	// Arrow marker definitions per relation kind
	const edgeKinds = ['contains', 'part_of', 'related'] as const;
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal-overlay" onclick={onclose}>
	<div class="modal graph-modal" onclick={(e) => e.stopPropagation()} use:trapFocus
		role="dialog" aria-modal="true" aria-labelledby="graph-modal-title" tabindex="-1">
		<div class="modal-header">
			<h2 id="graph-modal-title">Corpus Graph <span style="color:var(--muted-2);font-weight:400;font-size:12px;margin-left:8px">{docs.length} docs · {edges.length} relations</span></h2>
			<div style="display:flex;gap:6px;align-items:center">
				<div class="segmented">
					<button class="segmented-btn" class:active={layout === 'force'} onclick={() => (layout = 'force')}>Force</button>
					<button class="segmented-btn" class:active={layout === 'radial'} onclick={() => (layout = 'radial')}>Radial</button>
				</div>
				<button class="modal-close" onclick={onclose}>✕</button>
			</div>
		</div>

		<div class="graph-modal-body">
			<div class="graph-canvas" style="position:relative" onmouseleave={handleMouseLeave}>
				{#if computing}<div class="graph-loading" role="status">Computing layout…</div>{/if}
				<svg width={W} height={H} viewBox="0 0 {W} {H}">
					<defs>
						{#each edgeKinds as kind}
							<marker
								id="arrow-{kind}"
								markerWidth="6"
								markerHeight="6"
								refX="5"
								refY="3"
								orient="auto"
							>
								<path d="M0,0 L0,6 L6,3 z" fill={REL_COLORS[kind]} />
							</marker>
						{/each}
					</defs>

					<!-- Edges -->
					{#each edges as edge}
						{@const s = nodeMap.get(edge.source)}
						{@const t = nodeMap.get(edge.target)}
						{#if s && t}
							{@const dx = t.x - s.x}
							{@const dy = t.y - s.y}
							{@const len = Math.sqrt(dx*dx + dy*dy) || 1}
							{@const nr = t.kind === 'spec' ? 11 : t.kind === 'note' ? 14 : 12}
							{@const x2 = t.x - (dx/len) * (nr + 4)}
							{@const y2 = t.y - (dy/len) * (nr + 4)}
							<line
								x1={s.x} y1={s.y}
								x2={x2} y2={y2}
								stroke={REL_COLORS[edge.kind]}
								stroke-width="1.5"
								stroke-opacity={edgeOpacity(edge)}
								marker-end="url(#arrow-{edge.kind})"
							/>
						{/if}
					{/each}

					<!-- Nodes -->
					{#each nodes as node}
						{@const isFocus = node.id === focusId}
						{@const fill = statusFill[node.status] ?? '#e3ddcf'}
						{@const stroke = statusStroke[node.status] ?? '#8a8270'}
						<g
							opacity={nodeOpacity(node.id)}
							style="cursor:pointer"
							onmouseover={(e) => handleNodeHover(node.id, e)}
							onfocus={() => (hoverId = node.id)}
							onclick={() => { onnavigate(node.id); onclose(); }}
						>
							{#if node.kind === 'spec'}
								<rect
									x={node.x - 11} y={node.y - 11}
									width="22" height="22"
									fill={fill}
									stroke={stroke}
									stroke-width={isFocus ? 3 : 1.5}
									rx="1"
								/>
							{:else if node.kind === 'tasks'}
								<polygon
									points="{node.x},{node.y - 15} {node.x + 15},{node.y} {node.x},{node.y + 15} {node.x - 15},{node.y}"
									fill={fill}
									stroke={stroke}
									stroke-width={isFocus ? 3 : 1.5}
								/>
							{:else}
								<circle
									cx={node.x} cy={node.y} r="14"
									fill={fill}
									stroke={stroke}
									stroke-width={isFocus ? 3 : 1.5}
								/>
							{/if}
							<text
								x={node.x} y={node.y + 1}
								text-anchor="middle"
								dominant-baseline="middle"
								font-size="7"
								font-family="IBM Plex Mono, monospace"
								fill={stroke}
							>
								{node.id.replace(/^(change|spec)-/, '').slice(0, 6)}
							</text>
						</g>
					{/each}
				</svg>

				{#if hoverDoc}
					<div class="graph-hover-card" style="left:{Math.min(hoverPos.x, W - 200)}px;top:{Math.min(hoverPos.y, H - 80)}px">
						<div class="hover-id">{hoverDoc.id}</div>
						<div class="hover-title">{hoverDoc.title}</div>
						<StatusChip status={hoverDoc.status} />
					</div>
				{/if}
			</div>

			<div class="graph-legend">
				<h4>Nodes</h4>
				<div class="legend-item">
					<span class="legend-node-circle" style="color:var(--st-draft-dot)"></span>
					Change
				</div>
				<div class="legend-item">
					<span class="legend-node-square" style="color:var(--st-draft-dot)"></span>
					SPEC
				</div>

				<h4 style="margin-top:12px">Edges</h4>
				{#each edgeKinds as kind}
					<div class="legend-item">
						<span class="legend-edge" style="background:{REL_COLORS[kind]}"></span>
						{kind.replace('_', ' ')}
					</div>
				{/each}

				<h4 style="margin-top:12px">Status</h4>
				{#each Object.entries(statusStroke) as [st, color]}
					<div class="legend-item">
						<span style="width:8px;height:8px;border-radius:50%;background:{color};flex-shrink:0"></span>
						{st}
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
