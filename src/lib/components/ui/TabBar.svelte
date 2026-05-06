<script lang="ts">
    let {
        tabs,
        active,
        onchange
    }: {
        tabs: { id: string; label: string }[];
        active: string;
        onchange: (id: string) => void;
    } = $props();
</script>

<div class="flex gap-1 border-b mb-6">
    {#each tabs as tab}
        <button
            onclick={() => onchange(tab.id)}
            class="px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px"
            class:border-black={active === tab.id}
            class:text-black={active === tab.id}
            class:border-transparent={active !== tab.id}
            class:text-gray-500={active !== tab.id}
        >{tab.label}</button>
    {/each}
</div>
