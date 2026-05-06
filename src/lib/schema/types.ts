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
}

export interface CreateEntityTypeInput {
    name: string;
    description?: string;
    fields?: Array<Omit<Field, 'id'>>;
}

export interface UpdateEntityTypeInput {
    name?: string;
    description?: string;
    fields?: Field[];
}

export interface RelationshipType {
    id: string;
    projectId: string;
    name: string;
    description: string;
    sourceEntityTypeId: string | null;
    targetEntityTypeId: string | null;
    fields: Field[];
}

export interface CreateRelationshipTypeInput {
    name: string;
    description?: string;
    sourceEntityTypeId?: string;
    targetEntityTypeId?: string;
    fields?: Array<Omit<Field, 'id'>>;
}

export interface UpdateRelationshipTypeInput {
    name?: string;
    description?: string;
    sourceEntityTypeId?: string | null;
    targetEntityTypeId?: string | null;
    fields?: Field[];
}
