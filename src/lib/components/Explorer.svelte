<script lang="ts">
	import type { DocKind, DocStatus } from '$lib/meridian/format.js';
	import { KIND_LABELS, STATUS_LABELS } from '$lib/meridian/format.js';
	import type { MeridianDocSlim } from '$lib/meridian/corpus.js';
	import { explorerFilter } from '$lib/stores/explorer-filter.svelte.js';
	import { page } from '$app/state';

	let {
		docs,
		activeId = null,
		onselect
	}: {
		docs: MeridianDocSlim[];
		activeId?: string | null;
		onselect: (id: string) => void;
	} = $props();

	let search = $state('');
	let kindTab = $state<'all' | DocKind>('all');
	let activeStatuses = $state<Set<DocStatus>>(new Set());
	let rowEls: Record<string, HTMLElement> = {};

	const ALL_STATUSES: DocStatus[] = ['active', 'canonical', 'archived', 'legacy'];
	const ALL_KINDS: DocKind[] = ['proposal', 'design', 'tasks', 'adr', 'spec', 'tdd', 'note'];

	const statusDotColors: Record<DocStatus, string> = {
		active: 'var(--st-proposed-dot)',
		canonical: 'var(--st-accepted-dot)',
		archived: 'var(--st-superseded-dot)',
		legacy: 'var(--st-draft-dot)'
	};

	function toggleStatus(status: DocStatus) {
		const next = new Set(activeStatuses);
		if (next.has(status)) next.delete(status);
		else next.add(status);
		activeStatuses = next;
	}

	const activeProject = $derived(page.params?.project ?? null);
	const projectDocs = $derived(activeProject ? docs.filter((doc) => doc.project === activeProject) : docs);

	const filtered = $derived(projectDocs.filter((doc) => {
		const q = search.toLowerCase();
		if (kindTab !== 'all' && doc.kind !== kindTab) return false;
		if (activeStatuses.size > 0 && !activeStatuses.has(doc.status)) return false;
		if (q && !doc.id.toLowerCase().includes(q) && !doc.title.toLowerCase().includes(q) && !doc.tags.some((tag) => tag.toLowerCase().includes(q))) return false;
		return true;
	}));

	$effect(() => {
		explorerFilter.filteredIds = filtered.map((doc) => doc.id);
	});

	const active = $derived(filtered.filter((doc) => doc.status === 'active'));
	const canonical = $derived(filtered.filter((doc) => doc.status === 'canonical'));
	const archived = $derived(filtered.filter((doc) => doc.status === 'archived'));
	const legacy = $derived(filtered.filter((doc) => doc.status === 'legacy'));
	const groups = $derived([
		{ label: 'Active Changes', docs: active },
		{ label: 'Canonical Specs', docs: canonical },
		{ label: 'Archive', docs: archived },
		{ label: 'Legacy', docs: legacy }
	].filter((group) => group.docs.length > 0));

	function countKind(kind: DocKind): number {
		return projectDocs.filter((doc) => doc.kind === kind).length;
	}

	$effect(() => {
		const el = activeId ? rowEls[activeId] : null;
		if (!el) return;
		const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		el.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'instant' : 'smooth' });
	});
</script>

<aside class="explorer">
	{#if activeProject}
		<a class="back-link" href="/">← all projects</a>
	{/if}

	<div class="explorer-search">
		<div class="search-input-wrap">
			<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
				<circle cx="6.5" cy="6.5" r="5" />
				<path d="m10.5 10.5 3.5 3.5" />
			</svg>
			<input type="text" placeholder="Search OpenSpec…" bind:value={search} aria-label="Search OpenSpec artifacts" />
		</div>
	</div>

	{#if activeProject}
		<div class="explorer-project-header">
			<h3>{activeProject}</h3>
			<span class="count">{projectDocs.length} OpenSpec artifact{projectDocs.length === 1 ? '' : 's'}</span>
		</div>
	{/if}

	<div class="explorer-tabs" role="tablist" aria-label="Artifact type">
		<button class="tab-btn" class:active={kindTab === 'all'} role="tab" aria-selected={kindTab === 'all'} onclick={() => (kindTab = 'all')}>
			All <span class="tab-count">{projectDocs.length}</span>
		</button>
		{#each ALL_KINDS as kind}
			{@const count = countKind(kind)}
			{#if count > 0}
				<button class="tab-btn" class:active={kindTab === kind} role="tab" aria-selected={kindTab === kind} onclick={() => (kindTab = kind)}>
					{KIND_LABELS[kind]} <span class="tab-count">{count}</span>
				</button>
			{/if}
		{/each}
	</div>

	<div class="explorer-filters" role="group" aria-label="Filter by OpenSpec state">
		{#each ALL_STATUSES as status}
			<button class="status-filter-chip" class:active={activeStatuses.has(status)} onclick={() => toggleStatus(status)} aria-pressed={activeStatuses.has(status)}>
				<span class="dot" style="background:{statusDotColors[status]}"></span>
				{STATUS_LABELS[status]}
			</button>
		{/each}
	</div>

	<div class="explorer-list">
		{#each groups as group}
			<div class="corpus-group">
				<div class="corpus-group-label">{group.label}</div>
				{#each group.docs as doc}
					<div
						class="doc-row"
						class:active={doc.id === activeId}
						onclick={() => onselect(doc.id)}
						role="button"
						tabindex="0"
						onkeydown={(e) => e.key === 'Enter' && onselect(doc.id)}
						bind:this={rowEls[doc.id]}
					>
						<span class="doc-row-dot" style="background:{statusDotColors[doc.status]}"></span>
						<span class="doc-row-id">{doc.id}</span>
						<span class="doc-row-title">{doc.title}</span>
					</div>
				{/each}
			</div>
		{/each}

		{#if filtered.length === 0}
			<div class="empty-state" style="height:200px">
				<div class="empty-state-icon">⌕</div>
				<p>No OpenSpec artifacts match your search.</p>
			</div>
		{/if}
	</div>
</aside>

<style>
	.back-link {
		display: block; padding: 6px 14px;
		font-family: var(--f-sans); font-size: 12px; color: var(--accent);
		text-decoration: none; border-bottom: 1px solid var(--hairline);
	}
	.back-link:hover { text-decoration: underline; }

	.explorer-project-header {
		display: flex;
		align-items: baseline;
		gap: 8px;
		padding: 8px 12px 4px;
		border-bottom: 1px solid var(--hairline);
	}
	.explorer-project-header h3 {
		font-family: var(--f-serif);
		font-size: 13px;
		font-weight: 600;
		color: var(--ink);
	}
	.explorer-project-header .count {
		font-family: var(--f-sans);
		font-size: 11px;
		color: var(--muted-2);
	}
</style>
