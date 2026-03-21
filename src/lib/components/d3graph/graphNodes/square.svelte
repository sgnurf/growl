<script lang="ts">
    interface Props {
        size: number;
        color?: string;
        labelPropertyName: string;
        data?: any;
    }

    let { size, color = 'black', labelPropertyName, data = {} }: Props = $props();
</script>

<rect width={size} height={size} transform="translate(-{size / 2} -{size / 2})" fill={color} />
<text x={0} y={size / 2 + 10} text-anchor="middle" alignment-baseline="middle" stroke="black"
    >{data[labelPropertyName]}</text
>
