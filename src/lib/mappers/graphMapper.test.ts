import { entityToNode, entitiesToNodes, entityRelationshipToLink } from './graphMapper';
import type { Entity, EntityRelationship } from '$lib/entities/types';
import type { EntityType, RelationshipType } from '$lib/schema/types';
import type { EntityRepresentation, RelationshipRepresentation } from '$lib/representations/types';
import { defaultShapeConfigurations } from '$lib/components/d3graph/graphNodes/shapeConfiguration';

function makeEntityType(overrides: Partial<EntityType> = {}): EntityType {
    return {
        id: 'entity-type-1',
        projectId: 'project-1',
        name: 'Service',
        description: '',
        fields: [],
        representationId: null,
        ...overrides
    };
}

function makeEntity(overrides: Partial<Entity> = {}): Entity {
    return {
        id: 'entity-1',
        projectId: 'project-1',
        entityTypeId: 'entity-type-1',
        fieldValues: {},
        ...overrides
    };
}

const entityRepresentation: EntityRepresentation = {
    id: 'rep-1',
    name: 'Green Square',
    shapeType: 'square',
    shapeProps: { size: 12, color: 'green' },
    labelFieldName: 'title'
};

test("entityToNode resolves the entity type's assigned representation", () => {
    const entityType = makeEntityType({ representationId: entityRepresentation.id });
    const entity = makeEntity({ fieldValues: { title: 'Payment Service' } });

    const node = entityToNode(entity, [entityType], [entityRepresentation]);

    expect(node.shapeConfiguration.shapeType).toBe('square');
    expect(node.shapeConfiguration.shapeProps).toEqual({ size: 12, color: 'green' });
    expect(node.shapeConfiguration.labelPropertyName).toBe('title');
});

test('entityToNode falls back to the default round-robin shape when representationId is unset', () => {
    const entityType = makeEntityType({ representationId: null });
    const entity = makeEntity();

    const node = entityToNode(entity, [entityType], [entityRepresentation]);

    expect(node.shapeConfiguration).toBe(defaultShapeConfigurations[0]);
});

test('entityToNode falls back to the default shape when representationId does not resolve', () => {
    const entityType = makeEntityType({ representationId: 'missing-representation' });
    const entity = makeEntity();

    const node = entityToNode(entity, [entityType], [entityRepresentation]);

    expect(node.shapeConfiguration).toBe(defaultShapeConfigurations[0]);
});

test('entitiesToNodes maps every entity through entityToNode', () => {
    const entityType = makeEntityType({ representationId: entityRepresentation.id });
    const entities = [makeEntity({ id: 'a' }), makeEntity({ id: 'b' })];

    const nodes = entitiesToNodes(entities, [entityType], [entityRepresentation]);

    expect(nodes.map((n) => n.id)).toEqual(['a', 'b']);
    expect(nodes.every((n) => n.shapeConfiguration.shapeType === 'square')).toBe(true);
});

function makeRelationshipType(overrides: Partial<RelationshipType> = {}): RelationshipType {
    return {
        id: 'relationship-type-1',
        projectId: 'project-1',
        name: 'Depends On',
        description: '',
        sourceEntityTypeId: null,
        targetEntityTypeId: null,
        fields: [],
        representationId: null,
        ...overrides
    };
}

function makeRelationship(overrides: Partial<EntityRelationship> = {}): EntityRelationship {
    return {
        id: 'relationship-1',
        projectId: 'project-1',
        relationshipTypeId: 'relationship-type-1',
        sourceEntityId: 'a',
        targetEntityId: 'b',
        fieldValues: {},
        ...overrides
    };
}

const linkRepresentation: RelationshipRepresentation = {
    id: 'link-rep-1',
    name: 'Dashed Red',
    lineStyle: 'dashed',
    color: 'red',
    arrowhead: 'arrow',
    labelFieldName: 'protocol'
};

test("entityRelationshipToLink resolves the relationship type's assigned representation", () => {
    const relationshipType = makeRelationshipType({ representationId: linkRepresentation.id });
    const relationship = makeRelationship({ fieldValues: { protocol: 'HTTPS' } });

    const link = entityRelationshipToLink(relationship, [relationshipType], [linkRepresentation]);

    expect(link.representation).toEqual({
        lineStyle: 'dashed',
        color: 'red',
        arrowhead: 'arrow',
        labelPropertyName: 'protocol'
    });
    expect(link.data).toEqual({ protocol: 'HTTPS' });
});

test('entityRelationshipToLink falls back to the default line style when representationId is unset', () => {
    const relationshipType = makeRelationshipType({ representationId: null });
    const relationship = makeRelationship();

    const link = entityRelationshipToLink(relationship, [relationshipType], [linkRepresentation]);

    expect(link.representation).toEqual({
        lineStyle: 'solid',
        color: '#999999',
        arrowhead: 'none',
        labelPropertyName: null
    });
});

test('entityRelationshipToLink falls back to the default line style when the relationship type is unknown', () => {
    const relationship = makeRelationship({ relationshipTypeId: 'does-not-exist' });

    const link = entityRelationshipToLink(relationship, [], []);

    expect(link.representation).toEqual({
        lineStyle: 'solid',
        color: '#999999',
        arrowhead: 'none',
        labelPropertyName: null
    });
});
