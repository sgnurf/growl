<script lang="ts">
    import { page } from '$app/state';
</script>

<svelte:head>
    <title>Growl – View</title>
</svelte:head>

<h1 class="text-3xl font-bold mb-4">View {page.params.vid}</h1>
<p class="text-gray-400 text-sm mb-6">Project {page.params.id}</p>
<p class="text-gray-500">Filtered graph view — coming in Phase 3.</p>
