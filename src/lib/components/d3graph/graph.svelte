<svelte:options namespace="svg" />

<script lang="ts">
    import { untrack } from 'svelte';
    import * as d3 from 'd3';
    import type {
        Node,
        Link,
        GraphMode,
        SimulatedNode,
        SimulatedLink,
        GraphConfiguration
    } from './types';
    import type { DragBehaviourFactory } from './dragBehaviours';
    import type { ForceBehaviour } from './forceBehaviours';
    import {
        simulationDragBehaviour,
        staticDragBehaviour,
        editDragBehaviour,
        composeDragBehaviours,
        type GraphContext
    } from './dragBehaviours';
    import { simulationForceBehaviour, staticForceBehaviour } from './forceBehaviours';
    import Shape from './graphNodes/shape.svelte';

    interface ModeBehaviour {
        drag: DragBehaviourFactory;
        force: ForceBehaviour;
        cursor: string;
    }

    const MODE_BEHAVIOURS: Record<GraphMode, ModeBehaviour> = {
        Simulation: {
            drag: simulationDragBehaviour,
            force: simulationForceBehaviour,
            cursor: 'default'
        },
        Static: { drag: staticDragBehaviour, force: staticForceBehaviour, cursor: 'default' },
        Edit: { drag: editDragBehaviour, force: staticForceBehaviour, cursor: 'crosshair' }
    };

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
        // Capture tracked deps before entering untrack — simulation.nodes() reads node
        // properties (x, vx, fx…) through the reactive proxy, which would otherwise re-trigger
        // this effect on every D3 tick and reset alpha to 1, preventing convergence.
        const currentNodes = simulatedNodes;
        const alphaMin = config.alphaMin ?? 0.001;
        const alphaTarget = config.alphaTarget ?? 0;
        untrack(() => {
            simulation
                .nodes(currentNodes)
                .alphaMin(alphaMin)
                .alphaTarget(alphaTarget)
                .alpha(1)
                .restart();
        });
    });

    $effect(() => {
        MODE_BEHAVIOURS[mode].force.apply(
            simulation,
            simulatedNodes,
            simulatedLinks,
            nodeIds,
            config
        );
    });

    let edgeDragSource: SimulatedNode | null = $state(null);
    let edgeDragCursor: { x: number; y: number } | null = $state(null);

    $effect(() => {
        if (mode !== 'Edit') {
            edgeDragSource = null;
            edgeDragCursor = null;
        }
    });

    function getNodeAtClientPoint(clientX: number, clientY: number): SimulatedNode | undefined {
        const domNode = document.elementFromPoint(clientX, clientY)?.closest('[data-nodeId]');
        if (domNode) {
            const nodeId = (domNode as HTMLElement).dataset.nodeid;
            return simulatedNodes.find((n) => n.id == nodeId);
        }
    }

    function nodeDragging(sim: d3.Simulation<SimulatedNode, SimulatedLink>) {
        const ctx: GraphContext = {
            svg: () => svg,
            simulation: sim,
            getEdgeDragSource: () => edgeDragSource,
            setEdgeDragSource: (n) => {
                edgeDragSource = n;
            },
            getEdgeDragCursor: () => edgeDragCursor,
            setEdgeDragCursor: (c) => {
                edgeDragCursor = c;
            },
            triggerRender: () => {
                renderedNodes = [...simulatedNodes];
                renderedLinks = [...renderedLinks];
            },
            onCreateLink: () => onCreateLink,
            getNodeAtClientPoint
        };

        function dragSubject(e: any) {
            // sim.find expects simulation coordinates; inverse-transform from SVG/viewBox space.
            const transform = svg ? d3.zoomTransform(svg) : d3.zoomIdentity;
            const [simX, simY] = transform.invert([e.x, e.y]);
            const domNode = e.sourceEvent.target.closest('[data-nodeId]');
            if (domNode) {
                const nodeId = domNode.dataset.nodeid;
                const found = simulatedNodes.find((n) => n.id == nodeId);
                if (found) return found;
            }
            return sim.find(simX, simY, 10);
        }

        return d3
            .drag()
            .filter((event) => !event.button)
            .container(svg! as d3.DragContainerElement)
            .subject(dragSubject)
            .on('start', (e) => MODE_BEHAVIOURS[mode].drag(ctx).dragstarted(e))
            .on('drag', (e) => MODE_BEHAVIOURS[mode].drag(ctx).dragged(e))
            .on('end', (e) => MODE_BEHAVIOURS[mode].drag(ctx).dragended(e));
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
        renderedNodes = [...simulatedNodes];
        // simulatedLinks holds raw string IDs until D3's link force resolves them, which never
        // happens when stopSimulation is true. Always resolve from simulatedNodes by ID instead.
        renderedLinks = links
            .map((l) => ({
                source: simulatedNodes.find((n) => n.id === l.source),
                target: simulatedNodes.find((n) => n.id === l.target)
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
    style="max-width: 100%; height: auto; height: intrinsic; cursor: {MODE_BEHAVIOURS[mode]
        .cursor};"
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
