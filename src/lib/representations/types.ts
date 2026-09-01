export type LineStyle = 'solid' | 'dashed' | 'dotted';
export type ArrowheadStyle = 'none' | 'arrow' | 'open';

export interface EntityRepresentation {
    id: string;
    name: string;
    shapeType: string;
    shapeProps: Record<string, any>;
    labelFieldName: string;
}

export interface RelationshipRepresentation {
    id: string;
    name: string;
    lineStyle: LineStyle;
    color: string;
    arrowhead: ArrowheadStyle;
    labelFieldName: string | null;
}

export interface RepresentationLibrary {
    id: string;
    projectId: string;
    name: string;
    entityRepresentations: EntityRepresentation[];
    relationshipRepresentations: RelationshipRepresentation[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateRepresentationLibraryInput {
    name: string;
}

export interface UpdateRepresentationLibraryInput {
    name?: string;
    entityRepresentations?: EntityRepresentation[];
    relationshipRepresentations?: RelationshipRepresentation[];
}
