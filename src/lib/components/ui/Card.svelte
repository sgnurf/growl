<script lang="ts">
    import type { Snippet } from 'svelte';

    let {
        href,
        class: extraClass = '',
        children
    }: {
        href?: string;
        class?: string;
        children: Snippet;
    } = $props();

    const base = $derived(`border rounded-lg p-4 ${extraClass}`);
</script>

{#if href}
    <a {href} class="{base} block hover:bg-gray-50 transition-colors">
        {@render children()}
    </a>
{:else}
    <div class={base}>
        {@render children()}
    </div>
{/if}
