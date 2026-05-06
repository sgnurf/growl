<script lang="ts">
    let {
        id,
        name,
        type = 'text',
        value = '',
        placeholder = '',
        required = false,
        disabled = false,
        oninput,
        onchange
    }: {
        id?: string;
        name?: string;
        type?: string;
        value?: string | number;
        placeholder?: string;
        required?: boolean;
        disabled?: boolean;
        oninput?: (event: Event) => void;
        onchange?: (event: Event) => void;
    } = $props();
</script>

<input
    {id}
    {name}
    {type}
    {value}
    {placeholder}
    {required}
    {disabled}
    {oninput}
    {onchange}
    class="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black w-full"
/>
