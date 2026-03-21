<script lang="ts">
    interface Props {
        size?: number;
        color?: string;
        labelPropertyName: string;
        data?: any;
    }

    let { size = 10, color = 'black', labelPropertyName, data = {} }: Props = $props();

    let halfSize = $derived(size / 2);
</script>

<polygon points="-{halfSize},{halfSize} 0,-{halfSize} {halfSize},{halfSize}" fill={color} />
<text x={0} y={size / 2 + 10} text-anchor="middle" alignment-baseline="middle" stroke="black"
    >{data[labelPropertyName]}</text
>
