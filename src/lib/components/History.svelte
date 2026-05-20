<script lang="ts">
import { trapFocus } from '$lib/a11y/trap-focus.js';
import type { MeridianDoc } from '$lib/meridian/format.js';

let {
	doc,
	onclose,
}: {
	doc: MeridianDoc;
	onclose: () => void;
} = $props();

// Source context is synthesized from the OpenSpec artifact path.
interface HistoryEntry {
	date: string;
	author: string;
	message: string;
	diff?: { adds: string[]; removes: string[] };
}

const entries = $derived<HistoryEntry[]>([
	{
		date: doc.date ?? new Date().toISOString().split('T')[0],
		author: 'OpenSpec',
		message: `${doc.status} ${doc.kind}`,
		diff: {
			adds: [doc.filePath],
			removes: [],
		},
	},
]);
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal-overlay" onclick={onclose}>
	<div class="modal history-modal" onclick={(e) => e.stopPropagation()} use:trapFocus
		role="dialog" aria-modal="true" aria-labelledby="history-modal-title" tabindex="-1">
		<div class="modal-header">
			<h2 id="history-modal-title">Source — {doc.id}</h2>
			<button class="modal-close" onclick={onclose}>✕</button>
		</div>

		<div class="history-modal-body">
			{#each entries as entry, i}
				<div class="history-entry">
					<div class="history-timeline">
						<div class="history-dot"></div>
						{#if i < entries.length - 1}
							<div class="history-line"></div>
						{/if}
					</div>
					<div class="history-content">
						<div class="history-meta">
							<span class="history-date">{entry.date}</span>
							<span class="history-author">{entry.author}</span>
						</div>
						<div class="history-msg">{entry.message}</div>
						{#if entry.diff && (entry.diff.adds.length > 0 || entry.diff.removes.length > 0)}
							<div class="history-diff">
								{#each entry.diff.removes as line}
									<div class="diff-rem">- {line}</div>
								{/each}
								{#each entry.diff.adds as line}
									<div class="diff-add">+ {line}</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
