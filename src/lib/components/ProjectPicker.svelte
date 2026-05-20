<script lang="ts">
	import type { ProjectSummary } from '$lib/meridian/corpus.js';
	let { projects } = $props<{ projects: ProjectSummary[] }>();

	function relativeDate(dateStr: string): string {
		if (!dateStr) return '';
		const d = new Date(dateStr);
		const now = new Date();
		const days = Math.floor((now.getTime() - d.getTime()) / 86400000);
		if (days === 0) return 'today';
		if (days === 1) return 'yesterday';
		if (days < 7) return `${days}d ago`;
		if (days < 30) return `${Math.floor(days / 7)}w ago`;
		if (days < 365) return `${Math.floor(days / 30)}mo ago`;
		return `${Math.floor(days / 365)}y ago`;
	}
</script>

<main class="picker-main" id="doc-main" tabindex="-1">
	<div class="picker-hero">
		<h1 class="picker-title">Choose a project</h1>
		<p class="picker-sub">Pick a project to browse its OpenSpec artifacts. Press <kbd>⌘K</kbd> to search across all.</p>
	</div>
	<div class="picker-grid">
		{#each projects as p}
			<a class="picker-card" href="/{p.name}">
				<div class="picker-card-name">{p.name}</div>
				<div class="picker-card-counts">
					<span>{p.changeCount} change{p.changeCount !== 1 ? 's' : ''}</span>
					{#if p.adrCount > 0}
						<span class="sep">·</span>
						<span>{p.adrCount} ADR{p.adrCount !== 1 ? 's' : ''}</span>
					{/if}
					{#if p.specCount > 0}
						<span class="sep">·</span>
						<span>{p.specCount} spec{p.specCount !== 1 ? 's' : ''}</span>
					{/if}
					{#if p.tddCount > 0}
						<span class="sep">·</span>
						<span>{p.tddCount} TDD{p.tddCount !== 1 ? 's' : ''}</span>
					{/if}
					{#if p.artifactCount > 0}
						<span class="sep">·</span>
						<span>{p.artifactCount} artifact{p.artifactCount !== 1 ? 's' : ''}</span>
					{/if}
				</div>
				<div class="picker-card-status">
					{#if p.activeCount > 0}
						<span class="status-dot accepted"></span>
						<span>{p.activeCount} active</span>
					{/if}
					{#if p.archivedCount > 0}
						<span class="status-dot open"></span>
						<span>{p.archivedCount} archived</span>
					{/if}
				</div>
				<div class="picker-card-foot">
					{#if p.lastUpdated}updated {relativeDate(p.lastUpdated)}{/if}
				</div>
			</a>
		{/each}
	</div>
</main>
