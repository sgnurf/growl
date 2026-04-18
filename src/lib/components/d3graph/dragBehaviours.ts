import * as d3 from 'd3';
import type { SimulatedNode, SimulatedLink } from './types';

export interface GraphContext {
    svg: () => Element | undefined;
    simulation: d3.Simulation<SimulatedNode, SimulatedLink>;
    getEdgeDragSource: () => SimulatedNode | null;
    setEdgeDragSource: (n: SimulatedNode | null) => void;
    getEdgeDragCursor: () => { x: number; y: number } | null;
    setEdgeDragCursor: (c: { x: number; y: number } | null) => void;
    triggerRender: () => void;
    onCreateLink: () => ((source: string, target: string) => void) | undefined;
    getNodeAtClientPoint: (clientX: number, clientY: number) => SimulatedNode | undefined;
}

export interface DragBehaviour {
    dragstarted(e: any): void;
    dragged(e: any): void;
    dragended(e: any): void;
}

export type DragBehaviourFactory = (ctx: GraphContext) => DragBehaviour;

function moveNodeWithZoom(e: any, svgEl: Element | undefined): void {
    const k = (svgEl ? d3.zoomTransform(svgEl)?.k : undefined) ?? 1;
    e.subject.fx += e.dx / k;
    e.subject.fy += e.dy / k;
}

export function simulationDragBehaviour(ctx: GraphContext): DragBehaviour {
    return {
        dragstarted(e) {
            if (!e.active) ctx.simulation.alphaTarget(0.3).restart();
            e.subject.fx = e.subject.x;
            e.subject.fy = e.subject.y;
        },
        dragged(e) {
            moveNodeWithZoom(e, ctx.svg());
        },
        dragended(e) {
            if (!e.active) ctx.simulation.alphaTarget(0);
            if (!e.subject.fixed) {
                e.subject.fx = null;
                e.subject.fy = null;
            }
        }
    };
}

export function staticDragBehaviour(ctx: GraphContext): DragBehaviour {
    return {
        dragstarted(e) {
            e.subject.fx = e.subject.x;
            e.subject.fy = e.subject.y;
        },
        dragged(e) {
            moveNodeWithZoom(e, ctx.svg());
            ctx.triggerRender();
        },
        dragended(_e) {}
    };
}

export function editDragBehaviour(ctx: GraphContext): DragBehaviour {
    return {
        dragstarted(e) {
            if (e.subject) {
                ctx.setEdgeDragSource(e.subject);
                ctx.setEdgeDragCursor({ x: e.subject.x ?? 0, y: e.subject.y ?? 0 });
            }
        },
        dragged(e) {
            const svgEl = ctx.svg();
            const rawPos = d3.pointer(e.sourceEvent, svgEl);
            const transform = svgEl ? d3.zoomTransform(svgEl) : d3.zoomIdentity;
            const [simX, simY] = transform.invert(rawPos);
            ctx.setEdgeDragCursor({ x: simX, y: simY });
        },
        dragended(e) {
            const source = ctx.getEdgeDragSource();
            if (source) {
                const svgEl = ctx.svg();
                const rawPos = d3.pointer(e.sourceEvent, svgEl);
                const transform = svgEl ? d3.zoomTransform(svgEl) : d3.zoomIdentity;
                const [simX, simY] = transform.invert(rawPos);
                const targetNode =
                    ctx.getNodeAtClientPoint(e.sourceEvent.clientX, e.sourceEvent.clientY) ??
                    ctx.simulation.find(simX, simY, 20);
                if (targetNode && targetNode.id !== source.id) {
                    ctx.onCreateLink()?.(source.id, targetNode.id);
                }
            }
            ctx.setEdgeDragSource(null);
            ctx.setEdgeDragCursor(null);
        }
    };
}

export function composeDragBehaviours(...factories: DragBehaviourFactory[]): DragBehaviourFactory {
    return (ctx) => {
        const behaviours = factories.map((f) => f(ctx));
        return {
            dragstarted(e) {
                behaviours.forEach((b) => b.dragstarted(e));
            },
            dragged(e) {
                behaviours.forEach((b) => b.dragged(e));
            },
            dragended(e) {
                behaviours.forEach((b) => b.dragended(e));
            }
        };
    };
}
