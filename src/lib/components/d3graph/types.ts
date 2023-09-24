import type { ShapeConfiguration } from "./graphNodes/shapeConfiguration";

export interface Node {
    id: string;
    fixed?: boolean;
    shapeConfiguration: ShapeConfiguration;
    data: Record<string, any>;
};

export interface Link {
    source: string;
    target: string;
};

export interface NodeComponentProps<T> {
    id: string;
    x: number;
    y: number;
    data: T;
};