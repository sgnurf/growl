export type ViewFilter = {
    entityTypeIds: string[];
    relationshipTypeIds: string[];
};

export type NodePosition = {
    x: number;
    y: number;
};

export type View = {
    id: string;
    projectId: string;
    name: string;
    filter: ViewFilter;
    positions: Record<string, NodePosition>;
    createdAt: string;
    updatedAt: string;
};

export type CreateViewInput = {
    name: string;
    filter?: Partial<ViewFilter>;
};

export type UpdateViewInput = {
    name?: string;
    filter?: Partial<ViewFilter>;
};
