<script lang="ts">
    import type { Snippet } from 'svelte';

    let {
        for: htmlFor,
        required = false,
        children
    }: {
        for?: string;
        required?: boolean;
        children: Snippet;
    } = $props();
</script>

<label for={htmlFor} class="text-sm font-medium">
    {@render children()}{#if required}<span class="text-red-500 ml-0.5">*</span>{/if}
</label>
