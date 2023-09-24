<script lang="ts">
    export let size: number = 10;
    export let color: string = 'black';
    export let labelPropertyName: string;
    export let data: any = {};

    $: halfSize = size / 2;

</script>

<polygon points="-{halfSize},{halfSize} 0,-{halfSize} {halfSize},{halfSize}" fill={color} />
<text x={0} y={size/2 + 10} text-anchor="middle" alignment-baseline="middle" stroke="black" >{data[labelPropertyName]}</text>
