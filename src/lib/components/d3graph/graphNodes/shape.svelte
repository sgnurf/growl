<script lang="ts">
    import type { Component } from 'svelte';
    import Circle from './circle.svelte';
    import Custom from './custom.svelte';
    import Square from './square.svelte';
    import Triangle from './triangle.svelte';
    import type { ShapeConfiguration } from './shapeConfiguration';

    interface Props {
        shapeConfiguration: ShapeConfiguration;
        data: any;
    }

    let { shapeConfiguration, data }: Props = $props();

    const graphNodeMap = new Map<string, Component<any>>([
        ['circle', Circle],
        ['square', Square],
        ['triangle', Triangle],
        ['custom', Custom]
    ]);

    let NodeComponent = $derived(graphNodeMap.get(shapeConfiguration.shapeType) ?? Circle);
</script>

<NodeComponent
    labelPropertyName={shapeConfiguration.labelPropertyName}
    {data}
    {...shapeConfiguration.shapeProps}
/>
