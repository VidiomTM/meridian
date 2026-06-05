<script lang="ts">
import type { ProjectSummary } from '$lib/meridian/corpus.js';

let { projects } = $props<{ projects: ProjectSummary[] }>();

let searchQuery = $state('');

const filtered = $derived(
	searchQuery
		? projects.filter(
				(p: ProjectSummary) =>
					p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					formatPath(p.name).toLowerCase().includes(searchQuery.toLowerCase()),
			)
		: projects,
);

function formatPath(name: string): string {
	return `~/projects/${name.replace(/~/g, '/')}`;
}

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
		<p class="picker-sub">
			Pick a project to browse its OpenSpec artifacts.
			Press <kbd>⌘K</kbd> to search across all.
		</p>
	</div>

	{#if projects.length === 0}
		<div class="picker-empty" role="status">
			<div class="empty-icon" aria-hidden="true">
				<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
					<polyline points="14 2 14 8 20 8"/>
					<line x1="12" y1="18" x2="12" y2="12"/>
					<line x1="9" y1="15" x2="15" y2="15"/>
				</svg>
			</div>
			<h2 class="picker-empty-title">No OpenSpec workspaces found</h2>
			<p class="picker-empty-text">
				Meridian scans <code>MERIDIAN_ROOT</code> for directories containing
				a <code>openspec/</code> folder. No such directories were found.
			</p>
			<p class="picker-empty-text">
				Clone or create a project with an
				<a
					href="https://github.com/openspec/openspec"
					target="_blank"
					rel="noopener noreferrer"
				>OpenSpec workspace</a>
				to get started.
			</p>
		</div>
	{:else}
		<div class="picker-search-wrap">
			<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
				<circle cx="6.5" cy="6.5" r="5" />
				<path d="m10.5 10.5 3.5 3.5" />
			</svg>
			<input
				type="search"
				class="picker-search"
				placeholder="Filter projects by name or path…"
				aria-label="Filter projects"
				bind:value={searchQuery}
			/>
		</div>

		{#if filtered.length === 0}
			<div class="picker-empty" role="status">
				<h2 class="picker-empty-title">No projects match "{searchQuery}"</h2>
				<p class="picker-empty-text">Try a different search term.</p>
			</div>
		{:else}
			<div class="picker-grid" role="list">
				{#each filtered as p (p.name)}
					<div role="listitem">
					<a
						class="picker-card"
						href="/{p.name}"
					>
						<div class="picker-card-top">
							<div class="picker-card-name">{p.name}</div>
							<div class="picker-card-path">{formatPath(p.name)}</div>
						</div>
						<div class="picker-card-counts">
							<span class="count-badge change">{p.changeCount} change{p.changeCount !== 1 ? 's' : ''}</span>
							{#if p.adrCount > 0}
								<span class="count-badge adr">{p.adrCount} ADR{p.adrCount !== 1 ? 's' : ''}</span>
							{/if}
							{#if p.specCount > 0}
								<span class="count-badge spec">{p.specCount} spec{p.specCount !== 1 ? 's' : ''}</span>
							{/if}
							{#if p.tddCount > 0}
								<span class="count-badge tdd">{p.tddCount} TDD{p.tddCount !== 1 ? 's' : ''}</span>
							{/if}
							{#if p.artifactCount > 0}
								<span class="count-badge artifact">{p.artifactCount} artifact{p.artifactCount !== 1 ? 's' : ''}</span>
							{/if}
						</div>
						<div class="picker-card-foot">
							<div class="picker-card-status">
								{#if p.activeCount > 0}
									<span class="status-dot accepted" aria-hidden="true"></span>
									<span>{p.activeCount} active</span>
								{/if}
								{#if p.archivedCount > 0}
									<span class="status-dot open" aria-hidden="true"></span>
									<span>{p.archivedCount} archived</span>
								{/if}
							</div>
							<div class="picker-card-date">
								{#if p.lastUpdated}
									updated <time datetime={p.lastUpdated}>{relativeDate(p.lastUpdated)}</time>
								{/if}
							</div>
						</div>
						</a>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</main>

<style>
	.picker-main {
		grid-area: doc;
		overflow-y: auto;
		padding: 40px 32px 64px;
		max-width: 960px;
		margin: 0 auto;
		width: 100%;
	}

	.picker-hero {
		text-align: center;
		margin-bottom: 32px;
	}

	.picker-title {
		font-family: var(--f-serif);
		font-size: 28px;
		font-weight: 600;
		color: var(--ink);
		letter-spacing: -0.02em;
		margin-bottom: 8px;
	}

	.picker-sub {
		font-size: 14px;
		color: var(--muted);
	}

	.picker-sub kbd {
		font-family: var(--f-mono);
		font-size: 11px;
		background: var(--paper-3);
		border: 1px solid var(--line-2);
		border-radius: 2px;
		padding: 1px 4px;
	}

	/* === Search === */
	.picker-search-wrap {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		background: var(--paper-2);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		margin-bottom: 20px;
		transition: border-color 0.12s;
	}

	.picker-search-wrap:focus-within {
		border-color: var(--accent);
	}

	.picker-search-wrap svg {
		color: var(--muted-2);
		flex-shrink: 0;
	}

	.picker-search {
		flex: 1;
		background: transparent;
		border: none;
		font-family: var(--f-sans);
		font-size: 13px;
		color: var(--ink);
		outline: none;
	}

	.picker-search::placeholder {
		color: var(--muted-2);
	}

	/* === Empty State === */
	.picker-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 48px 24px;
		text-align: center;
		gap: 8px;
	}

	.empty-icon {
		color: var(--muted-2);
		margin-bottom: 8px;
		opacity: 0.5;
	}

	.picker-empty-title {
		font-family: var(--f-serif);
		font-size: 20px;
		font-weight: 600;
		color: var(--muted);
		margin-bottom: 4px;
	}

	.picker-empty-text {
		font-size: 13px;
		color: var(--muted-2);
		max-width: 400px;
		line-height: 1.5;
	}

	.picker-empty-text code {
		font-family: var(--f-mono);
		font-size: 12px;
		background: var(--paper-3);
		border: 1px solid var(--line);
		border-radius: 2px;
		padding: 1px 4px;
	}

	.picker-empty-text a {
		color: var(--accent);
		text-decoration: none;
		font-weight: 500;
	}

	.picker-empty-text a:hover {
		text-decoration: underline;
	}

	/* === Grid === */
	.picker-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 12px;
	}

	/* === Card === */
	.picker-card {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 16px;
		background: var(--paper-2);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		text-decoration: none;
		color: inherit;
		transition:
			border-color 0.12s,
			background 0.12s,
			box-shadow 0.12s;
		cursor: pointer;
	}

	.picker-card:hover {
		border-color: var(--accent);
		background: var(--paper);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
	}

	.picker-card:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
		border-radius: var(--radius);
	}

	.picker-card-top {
		min-width: 0;
	}

	.picker-card-name {
		font-family: var(--f-serif);
		font-size: 16px;
		font-weight: 600;
		color: var(--ink);
		margin-bottom: 2px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.picker-card-path {
		font-family: var(--f-mono);
		font-size: 11px;
		color: var(--muted-2);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.picker-card-counts {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}

	.count-badge {
		font-size: 10px;
		padding: 2px 6px;
		border-radius: 8px;
		background: var(--paper-3);
		border: 1px solid var(--line);
		color: var(--muted);
		font-family: var(--f-mono);
	}

	.count-badge.adr {
		color: var(--st-accepted-fg);
		background: var(--st-accepted-bg);
		border-color: var(--st-accepted-dot);
	}

	.count-badge.spec {
		color: var(--st-proposed-fg);
		background: var(--st-proposed-bg);
		border-color: var(--st-proposed-dot);
	}

	.count-badge.tdd {
		color: var(--st-review-fg);
		background: var(--st-review-bg);
		border-color: var(--st-review-dot);
	}

	.picker-card-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		font-size: 11px;
		color: var(--muted);
		margin-top: auto;
	}

	.picker-card-status {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.status-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.status-dot.accepted {
		background: var(--st-accepted-dot);
	}

	.status-dot.open {
		background: var(--st-proposed-dot);
	}

	.picker-card-date {
		font-size: 11px;
		color: var(--muted-2);
		white-space: nowrap;
	}
</style>
