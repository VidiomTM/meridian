<script lang="ts">
import type { InvEntry, MeridianDoc } from '$lib/meridian/format.js';
import { REL_COLORS, REL_LABELS } from '$lib/meridian/format.js';

let {
	doc,
	byId,
	inv,
	onOpenGraph,
	onNavigate,
}: {
	doc: MeridianDoc;
	byId: Record<string, MeridianDoc>;
	inv: Record<string, InvEntry>;
	onOpenGraph: () => void;
	onNavigate: (id: string) => void;
} = $props();

const invEntry = $derived(
	inv[doc.id] ?? {
		contained_by: [],
		contains_inv: [],
		related_from: [],
	},
);

type RelKind =
	| 'contains'
	| 'part_of'
	| 'related'
	| 'contained_by'
	| 'contains_inv'
	| 'related_from';

interface RelGroup {
	kind: RelKind;
	ids: string[];
}

const relGroups = $derived<RelGroup[]>(
	[
		{ kind: 'contains' as RelKind, ids: doc.contains },
		{ kind: 'part_of' as RelKind, ids: doc.part_of },
		{ kind: 'related' as RelKind, ids: doc.related },
		{ kind: 'contained_by' as RelKind, ids: invEntry.contained_by },
		{ kind: 'contains_inv' as RelKind, ids: invEntry.contains_inv },
		{ kind: 'related_from' as RelKind, ids: invEntry.related_from },
	].filter((g) => g.ids.length > 0),
);

const totalLinks = $derived(relGroups.reduce((s, g) => s + g.ids.length, 0));

const extIconLabels: Record<string, string> = {
	jira: 'J',
	github: 'G',
	confluence: 'C',
	slack: 'S',
};
</script>

<aside class="relations-rail">
	<div class="rail-header">
		<h3>Context <span style="color:var(--muted-2);font-weight:400;margin-left:4px">{totalLinks}</span></h3>
	</div>

	<div class="rail-scroll">
		<!-- Open graph link button (replaces mini radial graph) -->
		<button class="open-graph-btn" onclick={onOpenGraph}>
			{totalLinks} link{totalLinks !== 1 ? 's' : ''} · open full graph →
		</button>

		<!-- Relation groups -->
		{#each relGroups as group}
			<div class="relations-group">
				<div class="relations-group-header">
					<span class="rel-swatch" style="background:{REL_COLORS[group.kind] ?? 'var(--rel-related)'}"></span>
					<span class="rel-label">{REL_LABELS[group.kind] ?? group.kind}</span>
					<span class="rel-count">{group.ids.length}</span>
				</div>
				{#each group.ids as id}
					{@const target = byId[id]}
					<div
						class="relation-item"
						onclick={() => onNavigate(id)}
						role="button"
						tabindex="0"
						onkeydown={(e) => e.key === 'Enter' && onNavigate(id)}
					>
						<span class="relation-item-id">{id}</span>
						<span class="relation-item-title">{target?.title ?? id}</span>
						{#if target}
							<span class="rel-status-dot s-{target.status}"></span>
							<span class="rel-status-label">{target.status}</span>
						{/if}
					</div>
				{/each}
			</div>
		{/each}

		<!-- External links -->
		{#if doc.external.length > 0}
			<div class="externals-section">
				<h4>External links</h4>
				{#each doc.external as link}
					<a href={link.ref} class="external-item" target="_blank" rel="noopener noreferrer">
						<span class="ext-icon {link.kind}">{extIconLabels[link.kind] ?? '?'}</span>
						<span>{link.title ?? link.ref}</span>
					</a>
				{/each}
			</div>
		{/if}

	</div>
</aside>
