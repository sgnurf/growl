import type { Entity, EntityRelationship } from '$lib/entities/types';
import type { EntityType } from '$lib/schema/types';
import type { Node, Link } from '$lib/components/d3graph/types';
import type { ShapeConfiguration } from '$lib/components/d3graph/graphNodes/shapeConfiguration';
import { defaultShapeConfigurations } from '$lib/components/d3graph/graphNodes/shapeConfiguration';
import type { EntityRepresentation } from '$lib/representations/types';

function resolveShapeConfiguration(
    entityType: EntityType | undefined,
    entityTypeIndex: number,
    entityRepresentations: EntityRepresentation[]
): ShapeConfiguration {
    const representation = entityRepresentations.find(
        (rep) => rep.id === entityType?.representationId
    );
    if (representation) {
        return {
            id: representation.id,
            name: representation.name,
            shapeType: representation.shapeType,
            shapeProps: representation.shapeProps,
            labelPropertyName: representation.labelFieldName
        };
    }
    const shapeIndex = Math.max(entityTypeIndex, 0) % defaultShapeConfigurations.length;
    return defaultShapeConfigurations[shapeIndex];
}

export function entityToNode(
    entity: Entity,
    entityTypes: EntityType[],
    entityRepresentations: EntityRepresentation[] = []
): Node {
    const entityTypeIndex = entityTypes.findIndex((et) => et.id === entity.entityTypeId);
    const entityType = entityTypes[entityTypeIndex];

    return {
        id: entity.id,
        shapeConfiguration: resolveShapeConfiguration(
            entityType,
            entityTypeIndex,
            entityRepresentations
        ),
        data: {
            ...entity.fieldValues,
            // Fallback label: entity type name, so nodes always show something
            name: entity.fieldValues['name'] ?? entityType?.name ?? entity.id
        }
    };
}

export function entitiesToNodes(
    entities: Entity[],
    entityTypes: EntityType[],
    entityRepresentations: EntityRepresentation[] = []
): Node[] {
    return entities.map((entity) => entityToNode(entity, entityTypes, entityRepresentations));
}

export function entityRelationshipToLink(relationship: EntityRelationship): Link {
    return {
        source: relationship.sourceEntityId,
        target: relationship.targetEntityId,
        relationshipTypeId: relationship.relationshipTypeId
    };
}

export function entityRelationshipsToLinks(relationships: EntityRelationship[]): Link[] {
    return relationships.map(entityRelationshipToLink);
}
