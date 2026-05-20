<script lang="ts">
import { trapFocus } from '$lib/a11y/trap-focus.js';

let {
	theme,
	density,
	bodyType,
	graphLayout,
	onclose,
	onchange,
}: {
	theme: string;
	density: string;
	bodyType: string;
	graphLayout: string;
	onclose: () => void;
	onchange: (key: string, value: string) => void;
} = $props();
</script>

<div class="tweaks-panel" use:trapFocus role="dialog" aria-modal="true" aria-labelledby="tweaks-title">
	<div class="tweaks-header">
		<h3 id="tweaks-title">Appearance</h3>
		<button class="modal-close" style="width:22px;height:22px;font-size:12px" onclick={onclose}>✕</button>
	</div>

	<div class="tweaks-body">
		<div class="tweaks-section">
			<span class="tweaks-label">Theme</span>
			<div class="tweaks-opts">
				{#each ['paper', 'sepia', 'dark'] as t}
					<button
						class="tweak-opt"
						class:active={theme === t}
						onclick={() => onchange('theme', t)}
					>
						{t.charAt(0).toUpperCase() + t.slice(1)}
					</button>
				{/each}
			</div>
		</div>

		<div class="tweaks-section">
			<span class="tweaks-label">Density</span>
			<div class="tweaks-opts">
				{#each ['compact', 'comfortable', 'spacious'] as d}
					<button
						class="tweak-opt"
						class:active={density === d}
						onclick={() => onchange('density', d)}
					>
						{d.charAt(0).toUpperCase() + d.slice(1)}
					</button>
				{/each}
			</div>
		</div>

		<div class="tweaks-section">
			<span class="tweaks-label">Body type</span>
			<div class="tweaks-opts">
				{#each ['serif', 'sans'] as bt}
					<button
						class="tweak-opt"
						class:active={bodyType === bt}
						onclick={() => onchange('bodyType', bt)}
					>
						{bt.charAt(0).toUpperCase() + bt.slice(1)}
					</button>
				{/each}
			</div>
		</div>

		<div class="tweaks-section">
			<span class="tweaks-label">Graph layout</span>
			<div class="tweaks-opts">
				{#each ['force', 'radial'] as gl}
					<button
						class="tweak-opt"
						class:active={graphLayout === gl}
						onclick={() => onchange('graphLayout', gl)}
					>
						{gl.charAt(0).toUpperCase() + gl.slice(1)}
					</button>
				{/each}
			</div>
		</div>
	</div>
</div>
