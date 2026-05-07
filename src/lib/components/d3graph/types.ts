import type * as d3 from 'd3';
import type { ShapeConfiguration } from './graphNodes/shapeConfiguration';

export type GraphMode = 'Simulation' | 'Static' | 'Edit';

export interface Node {
    id: string;
    fixed?: boolean;
    shapeConfiguration: ShapeConfiguration;
    data: Record<string, any>;
}

export interface Link {
    source: string;
    target: string;
    relationshipTypeId?: string;
}

export interface NodeComponentProps<T> {
    id: string;
    x: number;
    y: number;
    data: T;
}

export interface SimulatedNode extends Node, d3.SimulationNodeDatum {}

export interface SimulatedLink {
    source: SimulatedNode;
    target: SimulatedNode;
}

export interface GraphConfiguration {
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
