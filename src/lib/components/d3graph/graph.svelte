<script lang="ts">
    import * as d3 from 'd3';
    import type { Node, Link } from './types';
    import Shape from './graphNodes/shape.svelte';
    import { Tooltip } from 'flowbite-svelte';

    interface SimulatedNode extends Node, d3.SimulationNodeDatum {}

    interface SimulatedLink {
        source: SimulatedNode;
        target: SimulatedNode;
    }

    interface GraphConfiguration {
        width?: number;
        height?: number;
        centeringForce?: boolean;
        linkDistance?: number;
        manyBodyForceStrength?: number;
        manyBodyForce?: boolean;
        manyBodyDistanceMax?: number;
        alphaMin?: number;
        alphaTarget?: number;
        stopSimulation?: boolean;
    }

    export let config: GraphConfiguration;
    export let nodes: Node[];
    export let links: Link[];

    let svg: Element;
    let viewBoxElement: Element;

    console.log(`[${new Date().toLocaleString()}] Initializing graph`);

    const width = config.width ?? 640;
    const height = config.height ?? 400;
    $: viewbox = `-${width / 2} -${height / 2} ${width} ${height}`;

    let simulatedNodes: SimulatedNode[] = [];

    $: nodeIds = d3.map(nodes, (n) => n.id);

    $: simulatedNodes = d3.map(nodes, (node) => {
        let existingIndex = simulatedNodes.findIndex((n) => n.id === node.id);
        return existingIndex == -1 ? { ...node } : simulatedNodes[existingIndex];
    });

    $: simulatedLinks = d3.map(links, (l) => ({ source: l.source, target: l.target }));

    let renderedNodes: SimulatedNode[] = [];
    let renderedLinks: SimulatedLink[] = [];

    $: simulation = d3
        .forceSimulation(simulatedNodes)
        .on('tick', () => {
            renderedNodes = [...simulatedNodes];
            //Retyping since at this point D3 will have replaced the ids with the actual nodes
            renderedLinks = [...simulatedLinks] as unknown as SimulatedLink[];
            //console.log(`[${new Date().toLocaleString()}] Tick ${simulation.alpha()}`);
        })
        .alphaMin(config.alphaMin ?? 0.001)
        .alphaTarget(config.alphaTarget ?? 0);

    $: {
        console.log(`[${new Date().toLocaleString()}] Start link force: ${config.linkDistance}`);
        if (!config.stopSimulation && config.linkDistance) {
            let forceLink = d3
                .forceLink(simulatedLinks)
                .id(({ index: i }) => nodeIds[i!])
                .distance(config.linkDistance ?? 50);
            simulation.force('link', forceLink);
        } else {
            simulation.force('link', null);
        }
    }

    $: {
        if (config.stopSimulation) {
            simulation.stop();

            //The simulation continues to run a few seconds even after stop() is called, fixing position as a workaround
            simulatedNodes.forEach((n) => {
                n.fx = n.x;
                n.fy = n.y;
            });
        } else {
            simulatedNodes.forEach((n) => {
                if (n.fixed) return;
                n.fx = null;
                n.fy = null;
            });

            simulation.restart();
        }
    }

    $: {
        if (!config.stopSimulation && config.manyBodyForce) {
            simulation.force(
                'charge',
                d3
                    .forceManyBody()
                    .strength(config.manyBodyForceStrength ?? -30)
                    .distanceMax(config.manyBodyDistanceMax ?? 10000)
            );
        } else {
            simulation.force('charge', null);
        }
    }

    $: {
        if (!config.stopSimulation && config.centeringForce) {
            simulation.force('center', d3.forceCenter(0, 0));
        } else {
            simulation.force('center', null);
        }
    }

    function nodeDragging(simulation: d3.Simulation<SimulatedNode, SimulatedLink>) {
        function dragstarted(e: any) {
            console.log(`[${new Date().toLocaleString()}] Drag started ${e.subject.id}`);
            if (!config.stopSimulation && !e.active) simulation.alphaTarget(0.3).restart();
            e.subject.fx = e.x;
            e.subject.fy = e.y;
        }

        function dragged(e: any) {
            console.log(`[${new Date().toLocaleString()}] current transform ${d3.zoomTransform(svg)}`);
            console.log(`[${new Date().toLocaleString()}] current studd ${e}`);

            let currentScale = d3.zoomTransform(svg)?.k ?? 1;

            e.subject.fx += e.dx / currentScale;
            e.subject.fy += e.dy / currentScale;

            console.log(`[${new Date().toLocaleString()}] Dragged ${e.subject.id}`);

            if (config.stopSimulation) {
                e.subject.x = e.x;
                e.subject.y = e.y;

                simulation.tick();
                renderedNodes = [...simulatedNodes];
                renderedLinks = [...simulatedLinks] as unknown as SimulatedLink[];
            }
        }

        function dragended(e: any) {
            if (config.stopSimulation) return;

            if (!e.active) simulation.alphaTarget(0);

            if (!e.subject.fixed) {
                e.subject.fx = null;
                e.subject.fy = null;
            }
        }

        function dragSubject(e: any) {
            console.log(`[${new Date().toLocaleString()}] Drag subject ${e.x} ${e.y}`);

            function getInteractedNode(e: any) {
                let domNode = e.sourceEvent.target.closest('[data-nodeId]');

                if (domNode) {
                    let nodeId = domNode.dataset.nodeid;
                    return simulatedNodes.find((n) => n.id == nodeId);
                }
            }

            return getInteractedNode(e) ?? simulation.find(e.x, e.y, 10);
        }

        return d3
            .drag()
            .container(svg as d3.DragContainerElement)
            .subject(dragSubject)
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended);
    }

    function zoomAndPan() {
        function handleZoom(e: any) {
            viewBoxElement.setAttribute("transform", e.transform);
        }

        return d3.zoom().on('zoom', handleZoom);
    }

    $: {
        console.log(`[${new Date().toLocaleString()}] Reassigning drag behaviour`);
        d3.select(svg)
            .call(nodeDragging(simulation))
            .call(zoomAndPan());
    }

    $: {
        console.log(`[${new Date().toLocaleString()}] Reassigning rendered node and links`);
        renderedNodes = [...simulatedNodes];
        renderedLinks = [...simulatedLinks] as unknown as SimulatedLink[];
    }

    let currentId = 0;

    function handleMousMove(e: MouseEvent) {
        // @ts-ignore
        currentId = e.currentTarget?.dataset?.nodeid ?? 0;
    }

</script>

<svelte:options namespace='svg'/>

<svg
    bind:this={svg}
    {width}
    {height}
    viewBox={viewbox}
    style="max-width: 100%; height: auto; height: intrinsic;"
>
    <g bind:this={viewBoxElement}>
        <g stroke="#999999" stroke-opacity="0.6" stroke-linecap="round">
            <!-- TODO: When simulation is stopped, if the list of links is refreshed we have ids instead of object in rendered links and this blows up  -->
            {#each renderedLinks as { source, target } (source.id + '-' + target.id)}
                <line
                    stroke-width="1"
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    data-linkId={source.id + '-' + target.id}
                />
            {/each}
        </g>
        <!-- TODO: Invetsigate if better to have one event at top + manual collision detection or event on each element like here-->
        <g fill="currentColor" stroke="#ffffff" stroke-opacity="1" stroke-width="1.5">
            {#each renderedNodes as { x, y, id, shapeConfiguration: configuration, data } (id)}
                {#if x !== undefined && y !== undefined}
                    <g transform="translate({x} {y})" data-nodeId={id} on:mousemove={handleMousMove} role="group">
                        <Shape shapeConfiguration={configuration} {data} />
                    </g>
                {/if}
            {/each}
        </g>
    </g>
</svg>
<div>
    <span>current:{currentId}</span>
</div>
