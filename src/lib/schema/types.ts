export type FieldType = 'string' | 'int' | 'boolean' | 'date' | 'url';

export interface Field {
    id: string;
    name: string;
    type: FieldType;
    required: boolean;
}

export interface EntityType {
    id: string;
    projectId: string;
    name: string;
    description: string;
    fields: Field[];
    representationId: string | null;
}

export interface CreateEntityTypeInput {
    name: string;
    description?: string;
    fields?: Array<Omit<Field, 'id'>>;
    representationId?: string | null;
}

export interface UpdateEntityTypeInput {
    name?: string;
    description?: string;
    fields?: Field[];
    representationId?: string | null;
}

export interface RelationshipType {
    id: string;
    projectId: string;
    name: string;
    description: string;
    sourceEntityTypeId: string | null;
    targetEntityTypeId: string | null;
    fields: Field[];
    representationId: string | null;
}

export interface CreateRelationshipTypeInput {
    name: string;
    description?: string;
    sourceEntityTypeId?: string;
    targetEntityTypeId?: string;
    fields?: Array<Omit<Field, 'id'>>;
    representationId?: string | null;
}

export interface UpdateRelationshipTypeInput {
    name?: string;
    description?: string;
    sourceEntityTypeId?: string | null;
    targetEntityTypeId?: string | null;
    fields?: Field[];
    representationId?: string | null;
}
