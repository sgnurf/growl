import { executeQuery } from './neo4j';
import type {
    RepresentationLibrary,
    CreateRepresentationLibraryInput,
    UpdateRepresentationLibraryInput,
    EntityRepresentation,
    RelationshipRepresentation
} from '$lib/representations/types';

// Representations are stored as JSON arrays on the library node (same pattern as
// EntityType.fields / RelationshipType.fields / View.filter elsewhere in this
// codebase), not as separate nodes linked by relationships. That keeps library
// reads/writes atomic and consistent with the rest of the schema model, at the cost of
// no graph-native queries over representations (e.g. "which types use this one") and
// no referential integrity for EntityType/RelationshipType.representationId — a
// dangling id is currently just treated as unset by graphMapper.ts. Revisit this
// choice if a real need for those queries (or safe delete-with-usage-check) shows up.

function uuid(): string {
    return crypto.randomUUID();
}

function now(): string {
    return new Date().toISOString();
}

function parseEntityRepresentations(json: string | null | undefined): EntityRepresentation[] {
    if (!json) return [];
    try {
        return JSON.parse(json);
    } catch {
        return [];
    }
}

function parseRelationshipRepresentations(
    json: string | null | undefined
): RelationshipRepresentation[] {
    if (!json) return [];
    try {
        return JSON.parse(json);
    } catch {
        return [];
    }
}

function mapRepresentationLibrary(node: {
    properties: Record<string, string>;
}): RepresentationLibrary {
    const l = node.properties;
    return {
        id: l.id,
        projectId: l.projectId,
        name: l.name,
        entityRepresentations: parseEntityRepresentations(l.entityRepresentations),
        relationshipRepresentations: parseRelationshipRepresentations(
            l.relationshipRepresentations
        ),
        createdAt: l.createdAt,
        updatedAt: l.updatedAt
    };
}

export async function listRepresentationLibraries(
    projectId: string
): Promise<RepresentationLibrary[]> {
    const result = await executeQuery(
        `MATCH (l:GrowlRepresentationLibrary {projectId: $projectId}) RETURN l ORDER BY l.createdAt`,
        { projectId }
    );
    return result.records.map((r) => mapRepresentationLibrary(r.get('l')));
}

export async function getRepresentationLibrary(id: string): Promise<RepresentationLibrary | null> {
    const result = await executeQuery(`MATCH (l:GrowlRepresentationLibrary {id: $id}) RETURN l`, {
        id
    });
    if (!result.records.length) return null;
    return mapRepresentationLibrary(result.records[0].get('l'));
}

export async function createRepresentationLibrary(
    projectId: string,
    input: CreateRepresentationLibraryInput
): Promise<RepresentationLibrary> {
    const id = uuid();
    const ts = now();
    const entityRepresentationsJson = JSON.stringify([]);
    const relationshipRepresentationsJson = JSON.stringify([]);
    await executeQuery(
        `MATCH (p:GrowlProject {id: $projectId})
         CREATE (l:GrowlRepresentationLibrary {
           id: $id, projectId: $projectId, name: $name,
           entityRepresentations: $entityRepresentations,
           relationshipRepresentations: $relationshipRepresentations,
           createdAt: $createdAt, updatedAt: $updatedAt
         })
         CREATE (l)-[:BELONGS_TO]->(p)`,
        {
            projectId,
            id,
            name: input.name,
            entityRepresentations: entityRepresentationsJson,
            relationshipRepresentations: relationshipRepresentationsJson,
            createdAt: ts,
            updatedAt: ts
        }
    );
    return {
        id,
        projectId,
        name: input.name,
        entityRepresentations: [],
        relationshipRepresentations: [],
        createdAt: ts,
        updatedAt: ts
    };
}

export async function updateRepresentationLibrary(
    id: string,
    input: UpdateRepresentationLibraryInput
): Promise<RepresentationLibrary | null> {
    const ts = now();
    const setParts: string[] = ['l.updatedAt = $updatedAt'];
    const params: Record<string, unknown> = { id, updatedAt: ts };

    if (input.name !== undefined) {
        setParts.push('l.name = $name');
        params.name = input.name;
    }
    if (input.entityRepresentations !== undefined) {
        setParts.push('l.entityRepresentations = $entityRepresentations');
        params.entityRepresentations = JSON.stringify(input.entityRepresentations);
    }
    if (input.relationshipRepresentations !== undefined) {
        setParts.push('l.relationshipRepresentations = $relationshipRepresentations');
        params.relationshipRepresentations = JSON.stringify(input.relationshipRepresentations);
    }

    const result = await executeQuery(
        `MATCH (l:GrowlRepresentationLibrary {id: $id}) SET ${setParts.join(', ')} RETURN l`,
        params
    );
    if (!result.records.length) return null;
    return mapRepresentationLibrary(result.records[0].get('l'));
}

export async function deleteRepresentationLibrary(id: string): Promise<boolean> {
    const result = await executeQuery(
        `MATCH (l:GrowlRepresentationLibrary {id: $id}) DETACH DELETE l`,
        { id }
    );
    return result.summary.counters.updates().nodesDeleted > 0;
}
