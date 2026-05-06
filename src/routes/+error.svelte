<script lang="ts">
    import { page } from '$app/state';
</script>

<svelte:head>
    <title>Growl – Error {page.status}</title>
</svelte:head>

<div class="max-w-lg mx-auto mt-24 text-center">
    <p class="text-6xl font-bold text-gray-200 mb-4">{page.status}</p>
    <p class="text-xl font-semibold mb-2">{page.error?.message ?? 'Something went wrong'}</p>
    <a href="/" class="text-sm text-blue-600 hover:underline">Back to projects</a>
</div>
