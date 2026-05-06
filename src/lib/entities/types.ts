export interface Entity {
    id: string;
    projectId: string;
    entityTypeId: string;
    fieldValues: Record<string, unknown>;
}

export interface CreateEntityInput {
    entityTypeId: string;
    fieldValues?: Record<string, unknown>;
}

export interface UpdateEntityInput {
    fieldValues: Record<string, unknown>;
}

export interface EntityRelationship {
    id: string;
    projectId: string;
    relationshipTypeId: string;
    sourceEntityId: string;
    targetEntityId: string;
    fieldValues: Record<string, unknown>;
}

export interface CreateEntityRelationshipInput {
    relationshipTypeId: string;
    sourceEntityId: string;
    targetEntityId: string;
    fieldValues?: Record<string, unknown>;
}
