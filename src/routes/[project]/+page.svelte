<script lang="ts">
import { page } from '$app/state';
import type { MeridianDocSlim } from '$lib/meridian/corpus.js';
import { KIND_LABELS } from '$lib/meridian/format.js';

type ProjectPageData = { projectDocs: MeridianDocSlim[] };
const PROJECT_KINDS: MeridianDocSlim['kind'][] = [
	'adr',
	'spec',
	'tdd',
	'proposal',
	'design',
	'tasks',
	'note',
];

let { data }: { data: ProjectPageData } = $props();

const artifactDocs = $derived(
	data.projectDocs.filter(
		(doc: MeridianDocSlim) => doc.id !== 'openspec-config',
	),
);
const featuredDoc = $derived(
	artifactDocs.find((doc: MeridianDocSlim) => doc.kind === 'adr') ??
		artifactDocs.find((doc: MeridianDocSlim) => doc.kind === 'spec') ??
		artifactDocs.find((doc: MeridianDocSlim) => doc.kind === 'tdd') ??
		artifactDocs[0] ??
		data.projectDocs[0],
);

function countKind(kind: MeridianDocSlim['kind']) {
	return data.projectDocs.filter((doc: MeridianDocSlim) => doc.kind === kind)
		.length;
}
</script>

<main class="doc-pane" id="doc-main" tabindex="-1">
	<div class="project-overview">
		<div class="doc-eyebrow">
			<div class="doc-eyebrow-top">
				<span class="doc-project-label">{page.params.project}</span>
				<span class="sep">/</span>
				<span class="doc-id">openspec</span>
			</div>
		</div>

		<h1 class="doc-title">OpenSpec artifacts</h1>
		<p class="doc-subtitle">
			{data.projectDocs.length} artifact{data.projectDocs.length === 1 ? '' : 's'} available. Use the left rail to open ADRs, specs, TDDs, changes, tasks, and config.
		</p>

		<div class="project-kind-grid" aria-label="Artifact counts">
			{#each PROJECT_KINDS as kind}
				{@const count = countKind(kind)}
				{#if count > 0}
					<div class="project-kind-card">
						<span class="kind-count">{count}</span>
						<span class="kind-label">{KIND_LABELS[kind]}</span>
					</div>
				{/if}
			{/each}
		</div>

		{#if featuredDoc}
			<a class="project-open-link" href="/{page.params.project}/{featuredDoc.id}">
				Open {KIND_LABELS[featuredDoc.kind]}: {featuredDoc.title}
			</a>
		{/if}
	</div>
</main>
<div class="relations-rail" style="grid-area:relations;background:var(--paper-2);border-left:1px solid var(--line)"></div>

<style>
	.project-overview {
		max-width: 760px;
		margin: 0 auto;
		padding: 56px 32px;
	}

	.project-kind-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(112px, 1fr));
		gap: 10px;
		margin: 28px 0;
	}

	.project-kind-card {
		border: 1px solid var(--line);
		background: var(--paper-2);
		border-radius: var(--radius);
		padding: 14px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.kind-count {
		font-family: var(--f-serif);
		font-size: 24px;
		color: var(--ink);
		line-height: 1;
	}

	.kind-label {
		font-family: var(--f-sans);
		font-size: 12px;
		color: var(--muted);
	}

	.project-open-link {
		display: inline-flex;
		align-items: center;
		max-width: 100%;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		padding: 8px 12px;
		color: var(--accent);
		background: var(--paper-2);
		font-family: var(--f-sans);
		font-size: 13px;
		text-decoration: none;
		overflow-wrap: anywhere;
	}

	.project-open-link:hover {
		text-decoration: underline;
	}
</style>
