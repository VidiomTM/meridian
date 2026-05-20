<script lang="ts">
import { trapFocus } from '$lib/a11y/trap-focus.js';

let { onClose } = $props<{ onClose: () => void }>();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal-overlay" onclick={onClose}>
	<div class="modal kbd-help-modal" use:trapFocus
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => e.key === 'Escape' && onClose()}
		role="dialog" aria-modal="true" aria-labelledby="kbd-title" tabindex="-1">
		<div class="modal-head">
			<h2 id="kbd-title">Keyboard shortcuts</h2>
			<button class="btn ghost" onclick={onClose} aria-label="Close">✕</button>
		</div>
		<table class="kbd-table">
			<tbody>
				<tr><td><kbd>j</kbd> / <kbd>k</kbd></td><td>Next / previous document</td></tr>
				<tr><td><kbd>g</kbd></td><td>Open relationship graph</td></tr>
				<tr><td><kbd>h</kbd></td><td>Open document history</td></tr>
				<tr><td><kbd>e</kbd></td><td>Toggle edit mode</td></tr>
				<tr><td><kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd></td><td>Jump to document</td></tr>
				<tr><td><kbd>?</kbd></td><td>Show this help</td></tr>
				<tr><td><kbd>Esc</kbd></td><td>Close any modal</td></tr>
			</tbody>
		</table>
	</div>
</div>
