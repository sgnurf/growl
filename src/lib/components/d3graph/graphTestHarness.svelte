<script lang="ts">
    import Graph from './graph.svelte';
    import type { Node, Link, GraphMode } from '$lib/components/d3graph/types';
    import { onMount } from 'svelte';
    import * as d3 from 'd3';
    import { defaultShapeConfigurations } from '$lib/components/d3graph/graphNodes/shapeConfiguration';

    interface MiserableNode {
        group: number;
        index: number;
        name: string;
    }

    interface MiserableLink {
        source: number;
        target: number;
        value: number;
    }

    interface MiserabletType {
        nodes: MiserableNode[];
        links: MiserableLink[];
    }

    let nodes: Node[] = $state([]);
    let links: Link[] = $state([]);

    let config = $state({
        width: 800,
        height: 600,
        centeringForce: true,
        linkDistance: 30,
        manyBodyForce: true,
        manyBodyForceStrength: -30,
        alphaMin: 0.001,
        alphaTarget: 0
    });

    let stopped = $state(false);
    let ctrlPressed = $state(false);

    let mode: GraphMode = $derived(ctrlPressed ? 'Edit' : stopped ? 'Static' : 'Simulation');

    $effect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Control') ctrlPressed = true;
        }
        function handleKeyUp(e: KeyboardEvent) {
            if (e.key === 'Control') ctrlPressed = false;
        }
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    });

    onMount(async function () {
        let data = (await d3.json(
            'https://vega.github.io/vega-datasets/data/miserables.json'
        )) as MiserabletType;
        nodes = data.nodes.map((n) => ({
            id: n.index.toString(),
            shapeConfiguration:
                defaultShapeConfigurations[n.index % defaultShapeConfigurations.length],
            data: n
        }));
        links = data.links.map((l) => ({
            source: l.source.toString(),
            target: l.target.toString()
        }));
    });

    // 	setInterval(function() {
    //       let n = nodes.pop();
    // 	  nodes = nodes;
    // 	  links = links.filter(l => l.source !== n?.id && l.target !== n?.id);
    //    }, 1000)
</script>

<section>
    <label>
        <input type="checkbox" bind:checked={stopped} />
        Stop simulation
    </label>
    <label>
        <input type="checkbox" bind:checked={config.centeringForce} />
        Center force
    </label>
    <label>
        <input type="checkbox" bind:checked={config.manyBodyForce} />
        Many to Many force
    </label>
    <label for="linkForce"
        >Link Force Distance
        <input type="range" id="linkForce" bind:value={config.linkDistance} min="0" max="100" />
    </label>
    <label for="linkForce"
        >Many Body Force Strength
        <input
            type="range"
            id="manyBodyForce"
            bind:value={config.manyBodyForceStrength}
            min="-200"
            max="100"
        />
    </label>
    <label for="alphTarget"
        >Alpha Target
        <input
            type="range"
            id="alphaTarget"
            bind:value={config.alphaTarget}
            min="0"
            max="1"
            step="0.001"
        />
    </label>
    <label for="alphaMin"
        >Alpha Min
        <input
            type="range"
            id="alphaMin"
            bind:value={config.alphaMin}
            min="0.001"
            max="1"
            step="0.001"
        />
    </label>

    <Graph
        {nodes}
        {links}
        {config}
        {mode}
        onCreateLink={(source, target) => {
            links = [...links, { source, target }];
        }}
    />
</section>
