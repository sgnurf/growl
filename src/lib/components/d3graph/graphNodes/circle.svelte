<script lang="ts">
    interface Props {
        size?: number;
        color?: string;
        labelPropertyName: string;
        data?: any;
    }

    let { size = 10, color = 'black', labelPropertyName, data = {} }: Props = $props();
</script>

<circle r={size / 2} cx={0} cy={0} fill={color} />
<text x={0} y={size / 2 + 10} text-anchor="middle" alignment-baseline="middle" stroke="black"
    >{data[labelPropertyName]}</text
>
