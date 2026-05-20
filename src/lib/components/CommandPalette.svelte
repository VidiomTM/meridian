<script lang="ts">
	import type { MeridianDocSlim } from '$lib/meridian/corpus.js';
	import type { DocStatus } from '$lib/meridian/format.js';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import StatusChip from './StatusChip.svelte';

	const KIND_ORDER: Record<string, number> = { note: 0, proposal: 1, design: 2, tasks: 3, adr: 4, spec: 5, tdd: 6 };

	let {
		docs,
		onclose
	}: {
		docs: MeridianDocSlim[];
		onclose: () => void;
	} = $props();

	let query = $state('');
	let selectedIdx = $state(0);
	let inputEl = $state<HTMLInputElement>();
	let scopeToProject = $state(false);

	const results = $derived(
		docs
			.filter((d) => {
				if (scopeToProject && d.project !== page.params.project) return false;
				const q = query.toLowerCase();
				return !q || d.id.toLowerCase().includes(q) || d.title.toLowerCase().includes(q) || d.tags.some((t) => t.toLowerCase().includes(q));
			})
			.sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.id.localeCompare(b.id))
	);

	function navigate(doc: MeridianDocSlim) {
		goto('/' + doc.project + '/' + doc.id);
		onclose();
	}

	function handleKeydown(e: KeyboardEvent) {
		const res = results;
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIdx = Math.min(selectedIdx + 1, res.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIdx = Math.max(selectedIdx - 1, 0);
		} else if (e.key === 'Enter') {
			if (res[selectedIdx]) {
				navigate(res[selectedIdx]);
			}
		} else if (e.key === 'Escape') {
			onclose();
		}
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="cmd-palette-overlay" onclick={onclose}>
	<div class="cmd-palette" onclick={(e) => e.stopPropagation()}
		role="dialog" aria-modal="true" aria-labelledby="cmd-palette-title" tabindex="-1">
		<div class="cmd-search-wrap">
			<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
				<circle cx="6.5" cy="6.5" r="5" />
				<path d="m10.5 10.5 3.5 3.5" />
			</svg>
			<input
				type="text"
				class="cmd-input"
				placeholder="Search by id, title, or tag..."
				bind:value={query}
				bind:this={inputEl}
				onkeydown={handleKeydown}
			/>
			{#if page.params.project}
				<button
					class="cmd-scope-chip"
					class:active={scopeToProject}
					onclick={() => (scopeToProject = !scopeToProject)}
					title="Toggle in-project filter"
				>
					In {page.params.project}
				</button>
			{/if}
		</div>

		<div class="cmd-results" role="listbox" aria-label="Results">
			{#each results as doc, i}
				<div
					class="cmd-result"
					class:selected={i === selectedIdx}
					onclick={() => navigate(doc)}
					role="option"
					tabindex="0"
					aria-selected={i === selectedIdx}
				>
					<span class="kind-chip">{doc.kind.toUpperCase()}</span>
					<div class="cmd-result-body">
						<div class="cmd-result-top">
							<span class="cmd-result-id">{doc.id}</span>
							<span class="cmd-result-title">{doc.title}</span>
						</div>
						<div class="cmd-result-project">{doc.project}</div>
					</div>
					<StatusChip status={doc.status as DocStatus} />
				</div>
			{/each}

			{#if results.length === 0}
				<div style="padding:20px;text-align:center;color:var(--muted-2);font-size:13px">
					No documents found
				</div>
			{/if}
		</div>

		<div class="cmd-footer">
			<span class="cmd-footer-hint"><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
			<span class="cmd-footer-hint"><kbd>↩</kbd> open</span>
			<span class="cmd-footer-hint"><kbd>esc</kbd> close</span>
		</div>
	</div>
</div>
