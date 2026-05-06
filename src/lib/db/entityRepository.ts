import { executeQuery } from './neo4j';
import type {
    Entity,
    CreateEntityInput,
    UpdateEntityInput,
    EntityRelationship,
    CreateEntityRelationshipInput
} from '$lib/entities/types';

function uuid(): string {
    return crypto.randomUUID();
}

function parseFieldValues(json: string | null | undefined): Record<string, unknown> {
    if (!json) return {};
    try {
        return JSON.parse(json);
    } catch {
        return {};
    }
}

function mapEntity(node: { properties: Record<string, string> }): Entity {
    const properties = node.properties;
    return {
        id: properties.id,
        projectId: properties.projectId,
        entityTypeId: properties.entityTypeId,
        fieldValues: parseFieldValues(properties.fieldValues)
    };
}

function mapEntityRelationship(
    rel: { properties: Record<string, string> },
    sourceEntityId: string,
    targetEntityId: string
): EntityRelationship {
    const properties = rel.properties;
    return {
        id: properties.id,
        projectId: properties.projectId,
        relationshipTypeId: properties.relationshipTypeId,
        sourceEntityId,
        targetEntityId,
        fieldValues: parseFieldValues(properties.fieldValues)
    };
}

// ── Entities ──────────────────────────────────────────────────────────────────

export async function listEntities(projectId: string): Promise<Entity[]> {
    const result = await executeQuery(
        `MATCH (e:GrowlEntity {projectId: $projectId}) RETURN e ORDER BY e.id`,
        { projectId }
    );
    return result.records.map((record) => mapEntity(record.get('e')));
}

export async function getEntity(id: string): Promise<Entity | null> {
    const result = await executeQuery(
        `MATCH (e:GrowlEntity {id: $id}) RETURN e`,
        { id }
    );
    if (!result.records.length) return null;
    return mapEntity(result.records[0].get('e'));
}

export async function createEntity(projectId: string, input: CreateEntityInput): Promise<Entity> {
    const id = uuid();
    const fieldValues = JSON.stringify(input.fieldValues ?? {});
    await executeQuery(
        `CREATE (e:GrowlEntity {
            id: $id,
            projectId: $projectId,
            entityTypeId: $entityTypeId,
            fieldValues: $fieldValues
        })`,
        { id, projectId, entityTypeId: input.entityTypeId, fieldValues }
    );
    return { id, projectId, entityTypeId: input.entityTypeId, fieldValues: input.fieldValues ?? {} };
}

export async function updateEntity(id: string, input: UpdateEntityInput): Promise<Entity | null> {
    const result = await executeQuery(
        `MATCH (e:GrowlEntity {id: $id}) SET e.fieldValues = $fieldValues RETURN e`,
        { id, fieldValues: JSON.stringify(input.fieldValues) }
    );
    if (!result.records.length) return null;
    return mapEntity(result.records[0].get('e'));
}

export async function deleteEntity(id: string): Promise<boolean> {
    const result = await executeQuery(
        `MATCH (e:GrowlEntity {id: $id}) DETACH DELETE e`,
        { id }
    );
    return result.summary.counters.updates().nodesDeleted > 0;
}

// ── Entity Relationships ──────────────────────────────────────────────────────

export async function listEntityRelationships(projectId: string): Promise<EntityRelationship[]> {
    const result = await executeQuery(
        `MATCH (source:GrowlEntity {projectId: $projectId})
               -[relationship:RELATES_TO {projectId: $projectId}]->
               (target:GrowlEntity)
         RETURN relationship, source.id AS sourceEntityId, target.id AS targetEntityId`,
        { projectId }
    );
    return result.records.map((record) =>
        mapEntityRelationship(
            record.get('relationship'),
            record.get('sourceEntityId'),
            record.get('targetEntityId')
        )
    );
}

export async function createEntityRelationship(
    projectId: string,
    input: CreateEntityRelationshipInput
): Promise<EntityRelationship> {
    const id = uuid();
    const fieldValues = JSON.stringify(input.fieldValues ?? {});
    await executeQuery(
        `MATCH (source:GrowlEntity {id: $sourceEntityId, projectId: $projectId}),
               (target:GrowlEntity {id: $targetEntityId, projectId: $projectId})
         CREATE (source)-[:RELATES_TO {
             id: $id,
             projectId: $projectId,
             relationshipTypeId: $relationshipTypeId,
             fieldValues: $fieldValues
         }]->(target)`,
        {
            id,
            projectId,
            relationshipTypeId: input.relationshipTypeId,
            sourceEntityId: input.sourceEntityId,
            targetEntityId: input.targetEntityId,
            fieldValues
        }
    );
    return {
        id,
        projectId,
        relationshipTypeId: input.relationshipTypeId,
        sourceEntityId: input.sourceEntityId,
        targetEntityId: input.targetEntityId,
        fieldValues: input.fieldValues ?? {}
    };
}

export async function deleteEntityRelationship(id: string): Promise<boolean> {
    const result = await executeQuery(
        `MATCH ()-[relationship:RELATES_TO {id: $id}]->() DELETE relationship`,
        { id }
    );
    return result.summary.counters.updates().relationshipsDeleted > 0;
}

// ── Composite ─────────────────────────────────────────────────────────────────

export async function getProjectGraph(
    projectId: string
): Promise<{ entities: Entity[]; relationships: EntityRelationship[] }> {
    const [entities, relationships] = await Promise.all([
        listEntities(projectId),
        listEntityRelationships(projectId)
    ]);
    return { entities, relationships };
}
