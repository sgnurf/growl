import type { Entity, EntityRelationship } from '$lib/entities/types';
import type { EntityType } from '$lib/schema/types';
import type { Node, Link } from '$lib/components/d3graph/types';
import { defaultShapeConfigurations } from '$lib/components/d3graph/graphNodes/shapeConfiguration';

// In Phase 4, Representations will drive shape and label selection.
// For now, entity types cycle through the default shapes, and the label
// uses the entity's 'name' field (the convention for the labelPropertyName).

export function entityToNode(entity: Entity, entityTypes: EntityType[]): Node {
    const entityTypeIndex = entityTypes.findIndex((et) => et.id === entity.entityTypeId);
    const shapeIndex = Math.max(entityTypeIndex, 0) % defaultShapeConfigurations.length;

    return {
        id: entity.id,
        shapeConfiguration: defaultShapeConfigurations[shapeIndex],
        data: {
            ...entity.fieldValues,
            // Fallback label: entity type name, so nodes always show something
            name: entity.fieldValues['name'] ?? entityTypes[entityTypeIndex]?.name ?? entity.id
        }
    };
}

export function entitiesToNodes(entities: Entity[], entityTypes: EntityType[]): Node[] {
    return entities.map((entity) => entityToNode(entity, entityTypes));
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
