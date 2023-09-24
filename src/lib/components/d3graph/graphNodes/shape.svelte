<script lang="ts">
    import type { ComponentType } from 'svelte';
    import Circle from './circle.svelte';
    import Custom from './custom.svelte';
    import Square from './square.svelte';
    import Triangle from './triangle.svelte';
    import type { ShapeConfiguration } from './shapeConfiguration';

    export let shapeConfiguration: ShapeConfiguration;
    export let data: any;

    const graphNodeMap = new Map<string, ComponentType>([
        ['circle', Circle],
        ['square', Square],
        ['triangle', Triangle],
        ['custom', Custom]
    ]);

    let nodeComponent = graphNodeMap.get(shapeConfiguration.shapeType) ?? Circle;
</script>

<svelte:component this={nodeComponent} labelPropertyName={shapeConfiguration.labelPropertyName} {data} {...shapeConfiguration.shapeProps} />
