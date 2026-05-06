<script lang="ts">
    import { page } from '$app/state';
    import type { LayoutData } from './$types';

    let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

    const navItems = $derived([
        { label: 'Graph', href: `/projects/${data.project.id}` },
        { label: 'Schema', href: `/projects/${data.project.id}/schema` }
    ]);
</script>

<div class="flex flex-col" style="height: calc(100vh - 4rem)">
    <nav class="shrink-0 border-b px-6 h-10 flex items-center gap-1 bg-white">
        <a href="/" class="text-sm text-gray-400 hover:text-black mr-2">← Projects</a>
        <span class="text-sm text-gray-300 mr-2">|</span>
        <span class="text-sm font-medium mr-4">{data.project.name}</span>
        {#each navItems as item}
            <a
                href={item.href}
                class="text-sm px-3 py-1 rounded transition-colors"
                class:bg-gray-100={page.url.pathname === item.href}
                class:font-medium={page.url.pathname === item.href}
                class:text-gray-600={page.url.pathname !== item.href}
                class:hover:text-black={page.url.pathname !== item.href}
            >{item.label}</a>
        {/each}
    </nav>

    <div class="flex-1 overflow-hidden">
        {@render children()}
    </div>
</div>
