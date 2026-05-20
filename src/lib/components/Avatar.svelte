<script lang="ts">
let { handle, size = 22 }: { handle: string; size?: number } = $props();

function initials(h: string): string {
	const clean = h.replace(/^@/, '');
	const parts = clean.split(/[-_.\s]/);
	if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
	return clean.slice(0, 2).toUpperCase();
}

function colorFor(h: string): string {
	const colors = [
		'#b14a3a',
		'#2d6b6b',
		'#4a7b3f',
		'#6e54ad',
		'#b88820',
		'#3a6b8a',
		'#8a3a6b',
		'#4a6b3a',
	];
	let hash = 0;
	for (let i = 0; i < h.length; i++)
		hash = (hash * 31 + h.charCodeAt(i)) & 0xffffffff;
	return colors[Math.abs(hash) % colors.length];
}
</script>

<span
	class="avatar"
	style="width:{size}px;height:{size}px;font-size:{Math.floor(size * 0.38)}px;background:{colorFor(handle)};color:#fff;border-color:transparent"
	title={handle}
>
	{initials(handle)}
</span>
