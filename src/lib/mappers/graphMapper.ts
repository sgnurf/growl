import type { Entity, EntityRelationship } from '$lib/entities/types';
import type { EntityType, RelationshipType } from '$lib/schema/types';
import type { Node, Link, LinkRepresentation } from '$lib/components/d3graph/types';
import type { ShapeConfiguration } from '$lib/components/d3graph/graphNodes/shapeConfiguration';
import { defaultShapeConfigurations } from '$lib/components/d3graph/graphNodes/shapeConfiguration';
import type { EntityRepresentation, RelationshipRepresentation } from '$lib/representations/types';

const DEFAULT_LINK_REPRESENTATION: LinkRepresentation = {
    lineStyle: 'solid',
    color: '#999999',
    arrowhead: 'none',
    labelPropertyName: null
};

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

function resolveLinkRepresentation(
    relationshipType: RelationshipType | undefined,
    relationshipRepresentations: RelationshipRepresentation[]
): LinkRepresentation {
    const representation = relationshipRepresentations.find(
        (rep) => rep.id === relationshipType?.representationId
    );
    if (!representation) return DEFAULT_LINK_REPRESENTATION;
    return {
        lineStyle: representation.lineStyle,
        color: representation.color,
        arrowhead: representation.arrowhead,
        labelPropertyName: representation.labelFieldName
    };
}

export function entityRelationshipToLink(
    relationship: EntityRelationship,
    relationshipTypes: RelationshipType[] = [],
    relationshipRepresentations: RelationshipRepresentation[] = []
): Link {
    const relationshipType = relationshipTypes.find(
        (rt) => rt.id === relationship.relationshipTypeId
    );
    return {
        source: relationship.sourceEntityId,
        target: relationship.targetEntityId,
        relationshipTypeId: relationship.relationshipTypeId,
        representation: resolveLinkRepresentation(relationshipType, relationshipRepresentations),
        data: relationship.fieldValues
    };
}

export function entityRelationshipsToLinks(
    relationships: EntityRelationship[],
    relationshipTypes: RelationshipType[] = [],
    relationshipRepresentations: RelationshipRepresentation[] = []
): Link[] {
    return relationships.map((relationship) =>
        entityRelationshipToLink(relationship, relationshipTypes, relationshipRepresentations)
    );
}
