<script lang="ts">
import type { DocStatus } from '$lib/meridian/format.js';
import { STATUS_LABELS } from '$lib/meridian/format.js';

let {
	status,
	changesRequested = false,
}: { status: DocStatus; changesRequested?: boolean } = $props();
</script>

<span class="status-chip {status}" class:changes-requested={changesRequested}>
	<span class="dot"></span>
	{changesRequested ? 'Changes Requested' : (STATUS_LABELS[status] ?? status)}
</span>
