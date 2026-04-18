<svelte:options namespace="svg" />

<script lang="ts">
    import { untrack } from 'svelte';
    import * as d3 from 'd3';
    import type { Node, Link, GraphMode } from './types';
    import Shape from './graphNodes/shape.svelte';

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
    }

    interface Props {
        config: GraphConfiguration;
        nodes: Node[];
        links: Link[];
        mode: GraphMode;
        onCreateLink?: (source: string, target: string) => void;
    }

    let { config, nodes, links, mode, onCreateLink }: Props = $props();

    let svg: Element | undefined = $state();
    let viewBoxElement: Element | undefined = $state();

    console.log(`[${new Date().toLocaleString()}] Initializing graph`);

    let width = $derived(config.width ?? 640);
    let height = $derived(config.height ?? 400);
    let viewbox = $derived(`-${width / 2} -${height / 2} ${width} ${height}`);

    let simulatedNodes: SimulatedNode[] = $state([]);

    let nodeIds = $derived(d3.map(nodes, (n) => n.id));

    $effect(() => {
        const currentNodes = nodes;
        simulatedNodes = d3.map(currentNodes, (node) => {
            const existing = untrack(() => simulatedNodes.find((n) => n.id === node.id));
            return existing ?? { ...node };
        });
    });

    let simulatedLinks = $derived(d3.map(links, (l) => ({ source: l.source, target: l.target })));

    let renderedNodes: SimulatedNode[] = $state([]);
    let renderedLinks: SimulatedLink[] = $state([]);

    // Simulation is created once — never inside $derived to avoid the state_unsafe_mutation error
    const simulation = d3.forceSimulation<SimulatedNode>().on('tick', () => {
        renderedNodes = [...simulatedNodes];
        // Only update links from simulatedLinks while running: when stopped the link force is null
        // so simulatedLinks still holds raw string IDs rather than resolved node objects.
        if (mode === 'Simulation') {
            //Retyping since at this point D3 will have replaced the ids with the actual nodes
            renderedLinks = [...simulatedLinks] as unknown as SimulatedLink[];
        }
    });

    $effect(() => {
        simulation
            .nodes(simulatedNodes)
            .alphaMin(config.alphaMin ?? 0.001)
            .alphaTarget(config.alphaTarget ?? 0)
            .alpha(1)
            .restart();
    });

    $effect(() => {
        if (mode === 'Simulation' && config.linkDistance) {
            let forceLink = d3
                .forceLink(simulatedLinks)
                .id(({ index: i }) => nodeIds[i!])
                .distance(config.linkDistance ?? 50);
            simulation.force('link', forceLink);
        } else {
            simulation.force('link', null);
        }
    });

    $effect(() => {
        if (mode !== 'Simulation') {
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
    });

    $effect(() => {
        if (mode === 'Simulation' && config.manyBodyForce) {
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
    });

    $effect(() => {
        if (mode === 'Simulation' && config.centeringForce) {
            simulation.force('center', d3.forceCenter(0, 0));
        } else {
            simulation.force('center', null);
        }
    });

    let edgeDragSource: SimulatedNode | null = $state(null);
    let edgeDragCursor: { x: number; y: number } | null = $state(null);

    $effect(() => {
        if (mode !== 'Edit') {
            edgeDragSource = null;
            edgeDragCursor = null;
        }
    });

    function getInteractedNode(e: any): SimulatedNode | undefined {
        const domNode = e.sourceEvent.target.closest('[data-nodeId]');
        if (domNode) {
            const nodeId = domNode.dataset.nodeid;
            return simulatedNodes.find((n) => n.id == nodeId);
        }
    }

    function getNodeAtClientPoint(clientX: number, clientY: number): SimulatedNode | undefined {
        const domNode = document.elementFromPoint(clientX, clientY)?.closest('[data-nodeId]');
        if (domNode) {
            const nodeId = (domNode as HTMLElement).dataset.nodeid;
            return simulatedNodes.find((n) => n.id == nodeId);
        }
    }

    function nodeDragging(sim: d3.Simulation<SimulatedNode, SimulatedLink>) {
        function dragstarted(e: any) {
            if (mode === 'Edit') {
                if (e.subject) {
                    edgeDragSource = e.subject;
                    edgeDragCursor = { x: e.subject.x ?? 0, y: e.subject.y ?? 0 };
                }
                return;
            }
            if (mode === 'Simulation' && !e.active) sim.alphaTarget(0.3).restart();
            // Use the node's own simulation coordinates, not the raw event position.
            // e.x/y are in SVG/viewBox space; after any pan/zoom they differ from simulation space.
            e.subject.fx = e.subject.x;
            e.subject.fy = e.subject.y;
        }

        function dragged(e: any) {
            if (mode === 'Edit') {
                const rawPos = d3.pointer(e.sourceEvent, svg);
                const transform = svg ? d3.zoomTransform(svg) : d3.zoomIdentity;
                const [simX, simY] = transform.invert(rawPos);
                edgeDragCursor = { x: simX, y: simY };
                return;
            }
            // e.dx/dy are deltas in SVG/viewBox space; dividing by zoom scale converts to simulation space.
            const k = (svg ? d3.zoomTransform(svg)?.k : undefined) ?? 1;

            e.subject.fx += e.dx / k;
            e.subject.fy += e.dy / k;

            if (mode === 'Static') {
                // fx/fy already updated above; tick propagates them to x/y for rendering.
                sim.tick();
                renderedNodes = [...simulatedNodes];
                renderedLinks = [...renderedLinks];
            }
        }

        function dragended(e: any) {
            if (mode === 'Edit') {
                if (edgeDragSource) {
                    const rawPos = d3.pointer(e.sourceEvent, svg);
                    const transform = svg ? d3.zoomTransform(svg) : d3.zoomIdentity;
                    const [simX, simY] = transform.invert(rawPos);
                    const targetNode =
                        getNodeAtClientPoint(e.sourceEvent.clientX, e.sourceEvent.clientY) ??
                        sim.find(simX, simY, 20);
                    if (targetNode && targetNode.id !== edgeDragSource.id) {
                        onCreateLink?.(edgeDragSource.id, targetNode.id);
                    }
                }
                edgeDragSource = null;
                edgeDragCursor = null;
                return;
            }
            if (mode === 'Static') return;

            if (!e.active) sim.alphaTarget(0);

            if (!e.subject.fixed) {
                e.subject.fx = null;
                e.subject.fy = null;
            }
        }

        function dragSubject(e: any) {
            // sim.find expects simulation coordinates; inverse-transform from SVG/viewBox space.
            const transform = svg ? d3.zoomTransform(svg) : d3.zoomIdentity;
            const [simX, simY] = transform.invert([e.x, e.y]);
            return getInteractedNode(e) ?? sim.find(simX, simY, 10);
        }

        return d3
            .drag()
            .filter((event) => !event.button) // default also excludes ctrlKey — allow it for edge drawing
            .container(svg! as d3.DragContainerElement)
            .subject(dragSubject)
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended);
    }

    function zoomAndPan() {
        function handleZoom(e: any) {
            viewBoxElement?.setAttribute('transform', e.transform);
        }

        return d3.zoom().on('zoom', handleZoom);
    }

    $effect(() => {
        if (!svg) return;
        d3.select(svg).call(nodeDragging(simulation)).call(zoomAndPan());
    });

    $effect(() => {
        console.log(`[${new Date().toLocaleString()}] Reassigning rendered node and links`);
        renderedNodes = [...simulatedNodes];
        // simulatedLinks holds raw string IDs until D3's link force resolves them, which never
        // happens when stopSimulation is true. Always resolve from simulatedNodes by ID instead.
        renderedLinks = links
            .map((l) => ({
                source: simulatedNodes.find((n) => n.id === l.source),
                target: simulatedNodes.find((n) => n.id === l.target),
            }))
            .filter((l): l is SimulatedLink => !!l.source && !!l.target);
    });

    let currentId = $state(0);

    function handleMousMove(e: MouseEvent) {
        // @ts-ignore
        currentId = e.currentTarget?.dataset?.nodeid ?? 0;
    }
</script>

<svg
    bind:this={svg}
    {width}
    {height}
    viewBox={viewbox}
    style="max-width: 100%; height: auto; height: intrinsic; cursor: {mode === 'Edit'
        ? 'crosshair'
        : 'default'};"
>
    <g bind:this={viewBoxElement}>
        {#if edgeDragSource && edgeDragCursor && edgeDragSource.x !== undefined && edgeDragSource.y !== undefined}
            <line
                x1={edgeDragSource.x}
                y1={edgeDragSource.y}
                x2={edgeDragCursor.x}
                y2={edgeDragCursor.y}
                stroke="#4488ff"
                stroke-width="2"
                stroke-dasharray="6,4"
                stroke-opacity="0.8"
                pointer-events="none"
            />
        {/if}
        <g stroke="#999999" stroke-opacity="0.6" stroke-linecap="round">
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
                    <g
                        transform="translate({x} {y})"
                        data-nodeId={id}
                        onmousemove={handleMousMove}
                        role="group"
                    >
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
