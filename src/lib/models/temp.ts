import type { ShapeConfiguration } from "$lib/components/d3graph/graphNodes/shapeConfiguration";

export type fieldType = "string" | "int";

export type NodeType = {
    id: string;
    defaultShapeConfigurationId: string;
    fields: Record<string, fieldType>;
}

export const sampleNodeTypes: NodeType[] = [
    {
        id: "User",
        defaultShapeConfigurationId: "defaultCircle",
        fields: {
            name: "string",
            jobTitle: "string",
        }
    },
    {
        id: "Project",
        defaultShapeConfigurationId: "defaultSquare",
        fields: {
            name: "string",
            description: "string",
            clientName: "string",
        }
    },
    {
        id: "Technology",
        defaultShapeConfigurationId: "defaultTriangle",
        fields: {
            name: "string",
        }
    }
];