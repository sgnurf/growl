import { untrack } from 'svelte';
import * as d3 from 'd3';
import type { SimulatedNode, SimulatedLink, GraphConfiguration } from './types';

export interface ForceBehaviour {
    apply(
        simulation: d3.Simulation<SimulatedNode, SimulatedLink>,
        nodes: SimulatedNode[],
        simulatedLinks: Array<{ source: string; target: string }>,
        nodeIds: string[],
        config: GraphConfiguration
    ): void;
}

export const simulationForceBehaviour: ForceBehaviour = {
    apply(simulation, nodes, simulatedLinks, nodeIds, config) {
        if (config.linkDistance) {
            simulation.force(
                'link',
                d3
                    .forceLink(simulatedLinks)
                    .id(({ index: i }) => nodeIds[i!])
                    .distance(config.linkDistance)
            );
        } else {
            simulation.force('link', null);
        }

        if (config.manyBodyForce) {
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

        simulation.force('center', config.centeringForce ? d3.forceCenter(0, 0) : null);

        // untrack: reading n.fixed through the reactive proxy inside an effect would re-trigger
        // the effect on every D3 tick (which mutates node properties), causing unwanted restarts.
        untrack(() =>
            nodes.forEach((n) => {
                if (!n.fixed) {
                    n.fx = null;
                    n.fy = null;
                }
            })
        );
        simulation.restart();
    }
};

export const staticForceBehaviour: ForceBehaviour = {
    apply(simulation, nodes) {
        simulation.force('link', null);
        simulation.force('charge', null);
        simulation.force('center', null);

        simulation.stop();
        // untrack: reading n.x / n.y through the reactive proxy inside an effect would re-trigger
        // the effect on every D3 tick, causing repeated stop() calls during the brief cool-down.
        untrack(() =>
            nodes.forEach((n) => {
                n.fx = n.x;
                n.fy = n.y;
            })
        );
    }
};
