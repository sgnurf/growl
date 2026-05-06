<script lang="ts">
    import type { Snippet } from 'svelte';
    import Label from './Label.svelte';

    let {
        label,
        for: htmlFor,
        required = false,
        class: extraClass = '',
        children
    }: {
        label: string;
        for?: string;
        required?: boolean;
        class?: string;
        children: Snippet;
    } = $props();

    const cls = $derived(`flex flex-col gap-2 ${extraClass}`);
</script>

<div class={cls}>
    <Label for={htmlFor} {required}>{label}</Label>
    {@render children()}
</div>
