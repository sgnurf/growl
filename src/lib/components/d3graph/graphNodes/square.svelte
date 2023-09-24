<script lang="ts">
    export let size: number;
    export let color: string = 'black';
    export let labelPropertyName: string;
    export let data: any = {};

    const width = size;
    const height = size;
</script>

<rect {width} {height} transform="translate(-{width/2} -{height/2})" fill={color} />
<text x={0} y={size/2 + 10} text-anchor="middle" alignment-baseline="middle" stroke="black" >{data[labelPropertyName]}</text>

