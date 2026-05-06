<script lang="ts">
    import type { Snippet } from 'svelte';

    type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
    type Size = 'md' | 'sm';

    let {
        variant = 'primary',
        size = 'md',
        type = 'button',
        disabled = false,
        onclick,
        class: extraClass = '',
        children
    }: {
        variant?: Variant;
        size?: Size;
        type?: 'button' | 'submit' | 'reset';
        disabled?: boolean;
        onclick?: (event: MouseEvent) => void;
        class?: string;
        children: Snippet;
    } = $props();

    const variantClasses: Record<Variant, string> = {
        primary: 'bg-black text-white rounded hover:bg-gray-800 transition-colors disabled:opacity-50',
        secondary: 'border rounded hover:bg-gray-100 transition-colors',
        ghost: 'text-xs text-blue-600 hover:underline',
        destructive: 'text-xs text-red-500 hover:underline'
    };

    const sizeClasses: Record<Size, string> = {
        md: 'px-4 py-2 text-sm',
        sm: 'px-3 py-1.5 text-sm'
    };

    const cls = $derived(
        [
            variantClasses[variant],
            variant === 'primary' || variant === 'secondary' ? sizeClasses[size] : '',
            extraClass
        ]
            .filter(Boolean)
            .join(' ')
    );
</script>

<button {type} {disabled} {onclick} class={cls}>
    {@render children()}
</button>
