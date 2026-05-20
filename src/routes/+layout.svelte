<script lang="ts">
import '../app.css';
import { onMount } from 'svelte';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import CommandPalette from '$lib/components/CommandPalette.svelte';
import Explorer from '$lib/components/Explorer.svelte';
import KeyboardHelp from '$lib/components/KeyboardHelp.svelte';
import type { InvEntry, MeridianDoc } from '$lib/meridian/format.js';
import { explorerFilter } from '$lib/stores/explorer-filter.svelte.js';

let GraphViewComponent = $state<any>(null);
let HistoryComponent = $state<any>(null);
let TweaksPanelComponent = $state<any>(null);

let { data, children } = $props();

// Theme state (persisted)
let theme = $state(
	typeof localStorage !== 'undefined'
		? (localStorage.getItem('meridian-theme') ?? 'paper')
		: 'paper',
);
let density = $state(
	typeof localStorage !== 'undefined'
		? (localStorage.getItem('meridian-density') ?? 'comfortable')
		: 'comfortable',
);
let bodyType = $state(
	typeof localStorage !== 'undefined'
		? (localStorage.getItem('meridian-bodytype') ?? 'serif')
		: 'serif',
);
let graphLayout = $state('force');

// Modals
let showGraph = $state(false);
let showHistory = $state(false);
let showPalette = $state(false);
let showTweaks = $state(false);
let showHelp = $state(false);

// Active doc derived from URL — now uses [project]/[docId] params
const activeId = $derived(page.params?.docId ?? null);
const activeDoc = $derived(
	activeId
		? (data.byId[activeId] ??
				data.byId[`${page.params.project}:${activeId}`] ??
				null)
		: null,
);

// Whether we're on the project picker page (no project param)
const isPickerPage = $derived(!page.params.project);

// Cross-platform modifier key label
const isMac =
	typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);
const kbdMod = isMac ? '⌘' : 'Ctrl+';

// Apply theme to html element
$effect(() => {
	if (typeof document !== 'undefined') {
		document.documentElement.setAttribute('data-theme', theme);
		document.documentElement.setAttribute('data-density', density);
		document.documentElement.setAttribute('data-body-type', bodyType);
		localStorage.setItem('meridian-theme', theme);
		localStorage.setItem('meridian-density', density);
		localStorage.setItem('meridian-bodytype', bodyType);
	}
});

// Lazy-load heavy modal components on first open
$effect(() => {
	if (showGraph && !GraphViewComponent) {
		import('$lib/components/GraphView.svelte').then(
			(m) => (GraphViewComponent = m.default),
		);
	}
	if (showHistory && !HistoryComponent) {
		import('$lib/components/History.svelte').then(
			(m) => (HistoryComponent = m.default),
		);
	}
	if (showTweaks && !TweaksPanelComponent) {
		import('$lib/components/TweaksPanel.svelte').then(
			(m) => (TweaksPanelComponent = m.default),
		);
	}
});

function handleNavigate(id: string) {
	const proj = page.params.project;
	if (proj) {
		goto(`/${proj}/${id}`);
	} else {
		// Fallback: find project for this id
		const doc = data.docs.find((d: { id: string }) => d.id === id);
		if (doc) goto(`/${(doc as any).project}/${id}`);
	}
}

function handleTweakChange(key: string, value: string) {
	if (key === 'theme') theme = value;
	else if (key === 'density') density = value;
	else if (key === 'bodyType') bodyType = value;
	else if (key === 'graphLayout') graphLayout = value;
}

// Wire up custom events from child pages
onMount(() => {
	const onOpenGraph = () => {
		showGraph = true;
	};
	const onOpenHistory = () => {
		showHistory = true;
	};
	window.addEventListener('meridian:open-graph', onOpenGraph);
	window.addEventListener('meridian:open-history', onOpenHistory);
	return () => {
		window.removeEventListener('meridian:open-graph', onOpenGraph);
		window.removeEventListener('meridian:open-history', onOpenHistory);
	};
});

// Keyboard shortcuts
function handleKeydown(e: KeyboardEvent) {
	const tag = (e.target as HTMLElement).tagName.toLowerCase();
	const inField =
		tag === 'input' ||
		tag === 'textarea' ||
		(e.target as HTMLElement).isContentEditable;
	if (inField && e.key !== 'Escape') return;

	if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
		e.preventDefault();
		showPalette = !showPalette;
		return;
	}

	if (e.key === 'Escape') {
		showGraph = false;
		showHistory = false;
		showPalette = false;
		showTweaks = false;
		showHelp = false;
		return;
	}

	if (inField) return;

	if (e.key === '?') {
		showHelp = true;
		return;
	}

	if (e.key === 'g') {
		showGraph = true;
		return;
	}

	if (e.key === 'h') {
		if (activeDoc) showHistory = true;
		return;
	}

	if (e.key === 'e') {
		window.dispatchEvent(new CustomEvent('meridian:toggle-edit'));
		return;
	}

	if (e.key === 'j' || e.key === 'k') {
		const proj = page.params.project;
		const fallback = proj
			? data.docs
					.filter((d: { project: string }) => d.project === proj)
					.map((d: { id: string }) => d.id)
			: data.docs.map((d: { id: string }) => d.id);
		const list =
			explorerFilter.filteredIds.length > 0
				? explorerFilter.filteredIds
				: fallback;
		const currentPage = page.params.docId ?? '';
		const idx = list.indexOf(currentPage);
		if (e.key === 'j') {
			const next =
				idx === -1 ? list[0] : list[Math.min(list.length - 1, idx + 1)];
			if (next) handleNavigate(next);
		} else {
			const prev =
				idx === -1 ? list[list.length - 1] : list[Math.max(0, idx - 1)];
			if (prev) handleNavigate(prev);
		}
		return;
	}
}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="app-shell" class:no-rails={isPickerPage}>
	<a class="skip-link" href="#doc-main">Skip to content</a>

	<!-- Top bar -->
	<header class="topbar">
		<a href="/" style="text-decoration:none">
			<span class="topbar-brand">Meridian <span>·</span> decisions</span>
		</a>

		<div class="topbar-sep"></div>

		<nav class="topbar-breadcrumb" aria-label="Breadcrumb">
			<a href="/" class="crumb-link">Meridian</a>
			{#if page.params.project}
				<span class="crumb-sep">›</span>
				<a href="/{page.params.project}" class="crumb-link crumb-project">{page.params.project}</a>
			{/if}
			{#if activeDoc}
				<span class="crumb-sep">›</span>
				<span class="crumb crumb-id">{activeDoc.id}</span>
				<span class="crumb-sep">·</span>
				<span class="crumb crumb-title">{activeDoc.title}</span>
			{/if}
		</nav>

		<div class="topbar-actions">
			<button class="btn-topbar" onclick={() => (showPalette = true)} title="Command palette ({kbdMod}K)">
				<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
					<circle cx="6.5" cy="6.5" r="5" />
					<path d="m10.5 10.5 3.5 3.5" />
				</svg>
				Search <kbd>{kbdMod}K</kbd>
			</button>
			<button class="btn-topbar" onclick={() => (showTweaks = !showTweaks)} title="Appearance">
				<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
					<circle cx="8" cy="8" r="3"/>
					<path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"/>
				</svg>
			</button>
			<button class="icon-btn" onclick={() => (showHelp = true)} title="Keyboard shortcuts (?)">?</button>
		</div>
	</header>

	<!-- Explorer (hidden on picker page via no-rails CSS) -->
	{#if !isPickerPage}
		<Explorer
			docs={data.docs}
			activeId={activeId}
			onselect={handleNavigate}
		/>
	{/if}

	<!-- Main content slot -->
	{@render children()}

	<!-- Status bar -->
	<footer class="statusbar">
		<div class="statusbar-item">
			<span class="statusbar-dot"></span>
			Synced
		</div>
		<span class="statusbar-sep">·</span>
		<div class="statusbar-item">
			{#if page.params.project}
				{data.docs.filter((d: { project: string }) => d.project === page.params.project).length} docs in {page.params.project}
			{:else}
				{(data.projects?.length ?? 0)} projects · {data.docs.length} docs
			{/if}
		</div>
		<span class="statusbar-sep">·</span>
		<button class="rail-link" style="background:none;border:none;cursor:pointer;font-size:11px;color:var(--muted)" onclick={() => (showGraph = true)}>
			Full graph
		</button>

		<div class="statusbar-right">
			<button class="icon-btn" onclick={() => (showHelp = true)} title="Keyboard shortcuts">?</button>
		</div>
	</footer>
</div>

<!-- Modals -->
{#if showGraph && GraphViewComponent}
	<GraphViewComponent
		docs={data.docs}
		focusId={activeId}
		onclose={() => (showGraph = false)}
		onnavigate={(id: string) => { handleNavigate(id); showGraph = false; }}
	/>
{/if}

{#if showHistory && activeDoc && HistoryComponent}
	<HistoryComponent
		doc={activeDoc}
		onclose={() => (showHistory = false)}
	/>
{/if}

{#if showPalette}
	<CommandPalette
		docs={data.docs}
		onclose={() => (showPalette = false)}
	/>
{/if}

{#if showTweaks && TweaksPanelComponent}
	<TweaksPanelComponent
		{theme}
		{density}
		{bodyType}
		{graphLayout}
		onclose={() => (showTweaks = false)}
		onchange={handleTweakChange}
	/>
{/if}

{#if showHelp}
	<KeyboardHelp onClose={() => (showHelp = false)} />
{/if}

<style>
	.crumb-link {
		font-size: 12px;
		color: var(--muted);
		text-decoration: none;
	}
	.crumb-link:hover {
		color: var(--ink);
		text-decoration: underline;
	}
	.crumb-link.crumb-project {
		color: var(--ink-2);
	}
</style>
