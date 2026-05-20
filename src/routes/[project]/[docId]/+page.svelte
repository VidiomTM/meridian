<script lang="ts">
import { goto } from '$app/navigation';
import { page } from '$app/state';
import DocView from '$lib/components/DocView.svelte';
import Relations from '$lib/components/Relations.svelte';
import type { InvEntry } from '$lib/meridian/format.js';

let { data } = $props();

function handleNavigate(id: string) {
	// Navigate within the same project
	goto(`/${page.params.project}/${id}`);
}

function openGraph() {
	window.dispatchEvent(new CustomEvent('meridian:open-graph'));
}

function openHistory() {
	window.dispatchEvent(new CustomEvent('meridian:open-history'));
}

const inv = $derived((data.inv ?? {}) as Record<string, InvEntry>);
</script>

<DocView
	doc={data.doc}
	onOpenGraph={openGraph}
	onOpenHistory={openHistory}
/>

<Relations
	doc={data.doc}
	byId={data.byId ?? {}}
	{inv}
	onOpenGraph={openGraph}
	onNavigate={handleNavigate}
/>
