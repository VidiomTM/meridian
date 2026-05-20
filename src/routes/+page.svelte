<script lang="ts">
import ProjectPicker from '$lib/components/ProjectPicker.svelte';

let { data } = $props();
</script>

<ProjectPicker projects={data.projects ?? []} />
