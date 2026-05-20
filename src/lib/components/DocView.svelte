<script lang="ts">
	import { invalidate } from '$app/navigation';
	import type { MeridianDoc } from '$lib/meridian/format.js';
	import { extractSubtitle } from '$lib/meridian/parser.js';
	import StatusChip from './StatusChip.svelte';

	let {
		doc,
		onOpenGraph,
		onOpenHistory
	}: {
		doc: MeridianDoc;
		onOpenGraph: () => void;
		onOpenHistory: () => void;
	} = $props();

	const subtitle = $derived(extractSubtitle(doc.rawBody, { description: doc.description }));
	const relativePath = $derived(doc.filePath.split('/projects/').at(-1) ?? doc.filePath);
	let editing = $state(false);
	let editedBody = $state('');
	let saving = $state(false);
	const editable = $derived(doc.source === 'openspec' && (doc.kind !== 'note' || doc.id === 'openspec-config') && Boolean(doc.project));
	const dirty = $derived(editedBody !== doc.rawBody);

	$effect(() => {
		doc.id;
		editedBody = doc.rawBody;
		editing = false;
	});

	async function save() {
		if (!editable || !doc.project || saving) return;
		saving = true;
		try {
			await fetch(`/api/docs/${encodeURIComponent(doc.project)}/${encodeURIComponent(doc.id)}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ body: editedBody })
			});
			await invalidate('app:doc');
			editing = false;
		} finally {
			saving = false;
		}
	}

	function discard() {
		editedBody = doc.rawBody;
		editing = false;
	}
</script>

<article id="doc-main" tabindex="-1" class="doc-pane">
	<div class="doc-toolbar">
		<span class="read-only-pill">{editable ? 'OpenSpec artifact' : 'OpenSpec summary'}</span>

		{#if editable}
			<div class="segmented">
				<button class="segmented-btn" class:active={!editing} onclick={() => (editing = false)}>Read</button>
				<button class="segmented-btn" class:active={editing} onclick={() => (editing = true)}>Edit</button>
			</div>
		{/if}

		{#if editing && dirty}
			<span class="unsaved-pill">Unsaved</span>
			<button class="btn primary" onclick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
			<button class="btn ghost" onclick={discard} disabled={saving}>Discard</button>
		{/if}

		<span class="toolbar-sep"></span>

		<button class="btn-doc" onclick={onOpenHistory} title="Source context">
			<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
				<circle cx="8" cy="8" r="6.5"/>
				<path d="M8 4.5v4l2.5 2"/>
			</svg>
			Source
		</button>

		<button class="btn-doc" onclick={onOpenGraph} title="Graph (g)">
			<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
				<circle cx="3" cy="8" r="2"/>
				<circle cx="13" cy="3" r="2"/>
				<circle cx="13" cy="13" r="2"/>
				<path d="M5 8h4.5M11 4.5 7 7M11 11.5 7 9"/>
			</svg>
			Graph
		</button>
	</div>

	<div class="doc-content">
		<div class="doc-eyebrow">
			<div class="doc-eyebrow-top">
				<span class="doc-project-label">{doc.project ?? ''}</span>
				<span class="sep">/</span>
				<span class="doc-id">{doc.id}</span>
			</div>
			<div class="doc-eyebrow-bottom">
				<StatusChip status={doc.status} />
				{#if doc.date}
					<span class="doc-date">{doc.date}</span>
				{/if}
				<span class="spacer"></span>
				<span class="meta-tag">{doc.kind}</span>
			</div>
		</div>

		{#if editing}
			<textarea class="doc-body-edit" bind:value={editedBody} aria-label="Edit OpenSpec artifact"></textarea>
		{:else}
			<h1 class="doc-title" data-block-id="doc-title">{doc.title}</h1>

			{#if subtitle}
				<p class="doc-subtitle" data-block-id="doc-subtitle">{subtitle}</p>
			{/if}

			<dl class="doc-meta">
				<dt>Path</dt>
				<dd><span class="meta-tag">{relativePath}</span></dd>

				{#if doc.tags.length > 0}
					<dt>Tags</dt>
					<dd>
						{#each doc.tags as tag}
							<span class="meta-tag">{tag}</span>
						{/each}
					</dd>
				{/if}
			</dl>

			<div class="doc-divider"></div>

			<div class="doc-body">
				{@html doc.body}
			</div>
		{/if}
	</div>
</article>

<style>
	.read-only-pill {
		border: 1px solid var(--line);
		border-radius: 999px;
		color: var(--muted-2);
		font-family: var(--f-sans);
		font-size: 11px;
		padding: 4px 9px;
	}
</style>
