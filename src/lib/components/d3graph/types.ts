import type * as d3 from 'd3';
import type { ShapeConfiguration } from './graphNodes/shapeConfiguration';

export type GraphMode = 'Simulation' | 'Static' | 'Edit';

export interface Node {
    id: string;
    fixed?: boolean;
    shapeConfiguration: ShapeConfiguration;
    data: Record<string, any>;
}

export type LinkLineStyle = 'solid' | 'dashed' | 'dotted';
export type LinkArrowhead = 'none' | 'arrow' | 'open';

export interface LinkRepresentation {
    lineStyle: LinkLineStyle;
    color: string;
    arrowhead: LinkArrowhead;
    labelPropertyName: string | null;
}

export interface Link {
    source: string;
    target: string;
    relationshipTypeId?: string;
    representation?: LinkRepresentation;
    data?: Record<string, any>;
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
    representation: LinkRepresentation | undefined;
    data: Record<string, any> | undefined;
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
