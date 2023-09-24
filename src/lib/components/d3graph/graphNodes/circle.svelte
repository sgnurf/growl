<script lang="ts">
    export let size: number = 10;
    export let color: string = 'black';
    export let labelPropertyName: string;
    export let data: any = {};

</script>

<circle r={size/2} cx={0} cy={0} fill={color}/>
<text x={0} y={size/2 + 10} text-anchor="middle" alignment-baseline="middle" stroke="black" >{data[labelPropertyName]}</text>

