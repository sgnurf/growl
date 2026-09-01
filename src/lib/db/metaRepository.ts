import { executeQuery } from './neo4j';
import type { Project, CreateProjectInput, UpdateProjectInput } from '$lib/projects/types';
import type {
    EntityType,
    CreateEntityTypeInput,
    UpdateEntityTypeInput,
    RelationshipType,
    CreateRelationshipTypeInput,
    UpdateRelationshipTypeInput,
    Field
} from '$lib/schema/types';
import type { User } from '$lib/users/types';
import { createRepresentationLibrary, updateRepresentationLibrary } from './representationLibraryRepository';
import { defaultShapeConfigurations } from '$lib/components/d3graph/graphNodes/shapeConfiguration';
import type { EntityRepresentation, RelationshipRepresentation } from '$lib/representations/types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function now(): string {
    return new Date().toISOString();
}

function uuid(): string {
    return crypto.randomUUID();
}

function fieldsToJson(fields: Array<Omit<Field, 'id'>>): string {
    return JSON.stringify(
        fields.map((f) => ({ ...f, id: uuid() }))
    );
}

function parseFields(json: string | null | undefined): Field[] {
    if (!json) return [];
    try {
        return JSON.parse(json);
    } catch {
        return [];
    }
}

function mapProject(node: { properties: Record<string, string> }): Project {
    const p = node.properties;
    return {
        id: p.id,
        name: p.name,
        description: p.description ?? '',
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
    };
}

function mapEntityType(node: { properties: Record<string, string> }): EntityType {
    const et = node.properties;
    return {
        id: et.id,
        projectId: et.projectId,
        name: et.name,
        description: et.description ?? '',
        fields: parseFields(et.fields),
        representationId: et.representationId ?? null
    };
}

function mapRelationshipType(node: { properties: Record<string, string> }): RelationshipType {
    const rt = node.properties;
    return {
        id: rt.id,
        projectId: rt.projectId,
        name: rt.name,
        description: rt.description ?? '',
        sourceEntityTypeId: rt.sourceEntityTypeId ?? null,
        targetEntityTypeId: rt.targetEntityTypeId ?? null,
        fields: parseFields(rt.fields),
        representationId: rt.representationId ?? null
    };
}

function defaultSeedEntityRepresentations(): EntityRepresentation[] {
    return defaultShapeConfigurations.map((shape) => ({
        id: shape.id,
        name: shape.name,
        shapeType: shape.shapeType,
        shapeProps: shape.shapeProps,
        labelFieldName: shape.labelPropertyName
    }));
}

function defaultSeedRelationshipRepresentations(): RelationshipRepresentation[] {
    return [
        {
            id: uuid(),
            name: 'Default Line',
            lineStyle: 'solid',
            color: '#999999',
            arrowhead: 'none',
            labelFieldName: null
        }
    ];
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function ensureUser(user: User): Promise<void> {
    await executeQuery(
        `MERGE (u:GrowlUser {id: $id})
         ON CREATE SET u.email = $email, u.name = $name`,
        { id: user.id, email: user.email, name: user.name }
    );
}

// ── Projects ──────────────────────────────────────────────────────────────────

export async function listProjects(userId: string): Promise<Project[]> {
    const result = await executeQuery(
        `MATCH (u:GrowlUser {id: $userId})-[:MEMBER_OF]->(p:GrowlProject)
         RETURN p ORDER BY p.name`,
        { userId }
    );
    return result.records.map((r) => mapProject(r.get('p')));
}

export async function getProject(id: string): Promise<Project | null> {
    const result = await executeQuery(
        `MATCH (p:GrowlProject {id: $id}) RETURN p`,
        { id }
    );
    if (!result.records.length) return null;
    return mapProject(result.records[0].get('p'));
}

export async function createProject(input: CreateProjectInput, user: User): Promise<Project> {
    const id = uuid();
    const ts = now();
    await executeQuery(
        `MERGE (u:GrowlUser {id: $userId})
           ON CREATE SET u.email = $email, u.name = $userName
         CREATE (p:GrowlProject {
           id: $id, name: $name, description: $description,
           createdAt: $createdAt, updatedAt: $updatedAt
         })
         CREATE (u)-[:MEMBER_OF {role: 'Owner'}]->(p)`,
        {
            userId: user.id,
            email: user.email,
            userName: user.name,
            id,
            name: input.name,
            description: input.description ?? '',
            createdAt: ts,
            updatedAt: ts
        }
    );
    const project = { id, name: input.name, description: input.description ?? '', createdAt: ts, updatedAt: ts };

    const library = await createRepresentationLibrary(id, { name: 'Default' });
    await updateRepresentationLibrary(library.id, {
        entityRepresentations: defaultSeedEntityRepresentations(),
        relationshipRepresentations: defaultSeedRelationshipRepresentations()
    });

    return project;
}

export async function updateProject(id: string, input: UpdateProjectInput): Promise<Project | null> {
    const ts = now();
    const setParts: string[] = ['p.updatedAt = $updatedAt'];
    const params: Record<string, unknown> = { id, updatedAt: ts };

    if (input.name !== undefined) { setParts.push('p.name = $name'); params.name = input.name; }
    if (input.description !== undefined) { setParts.push('p.description = $description'); params.description = input.description; }

    const result = await executeQuery(
        `MATCH (p:GrowlProject {id: $id}) SET ${setParts.join(', ')} RETURN p`,
        params
    );
    if (!result.records.length) return null;
    return mapProject(result.records[0].get('p'));
}

export async function deleteProject(id: string): Promise<boolean> {
    await executeQuery(`MATCH ()-[r:RELATES_TO {projectId: $id}]->() DELETE r`, { id });
    await executeQuery(`MATCH (e:GrowlEntity {projectId: $id}) DETACH DELETE e`, { id });
    await executeQuery(`MATCH (et:GrowlEntityType {projectId: $id}) DETACH DELETE et`, { id });
    await executeQuery(`MATCH (rt:GrowlRelationshipType {projectId: $id}) DETACH DELETE rt`, { id });
    await executeQuery(`MATCH (v:GrowlView {projectId: $id}) DETACH DELETE v`, { id });
    await executeQuery(`MATCH (l:GrowlRepresentationLibrary {projectId: $id}) DETACH DELETE l`, { id });
    const result = await executeQuery(`MATCH (p:GrowlProject {id: $id}) DETACH DELETE p`, { id });
    return result.summary.counters.updates().nodesDeleted > 0;
}

// ── Entity Types ──────────────────────────────────────────────────────────────

export async function listEntityTypes(projectId: string): Promise<EntityType[]> {
    const result = await executeQuery(
        `MATCH (et:GrowlEntityType {projectId: $projectId}) RETURN et ORDER BY et.name`,
        { projectId }
    );
    return result.records.map((r) => mapEntityType(r.get('et')));
}

export async function getEntityType(id: string): Promise<EntityType | null> {
    const result = await executeQuery(
        `MATCH (et:GrowlEntityType {id: $id}) RETURN et`,
        { id }
    );
    if (!result.records.length) return null;
    return mapEntityType(result.records[0].get('et'));
}

export async function createEntityType(
    projectId: string,
    input: CreateEntityTypeInput
): Promise<EntityType> {
    const id = uuid();
    const fieldsJson = fieldsToJson(input.fields ?? []);
    const representationId = input.representationId ?? null;
    await executeQuery(
        `MATCH (p:GrowlProject {id: $projectId})
         CREATE (et:GrowlEntityType {
           id: $id, projectId: $projectId, name: $name,
           description: $description, fields: $fields, representationId: $representationId
         })
         CREATE (et)-[:BELONGS_TO]->(p)`,
        {
            projectId, id, name: input.name, description: input.description ?? '',
            fields: fieldsJson, representationId
        }
    );
    return {
        id, projectId, name: input.name, description: input.description ?? '',
        fields: parseFields(fieldsJson), representationId
    };
}

export async function updateEntityType(
    id: string,
    input: UpdateEntityTypeInput
): Promise<EntityType | null> {
    const setParts: string[] = [];
    const params: Record<string, unknown> = { id };

    if (input.name !== undefined) { setParts.push('et.name = $name'); params.name = input.name; }
    if (input.description !== undefined) { setParts.push('et.description = $description'); params.description = input.description; }
    if (input.fields !== undefined) { setParts.push('et.fields = $fields'); params.fields = JSON.stringify(input.fields); }
    if ('representationId' in input) { setParts.push('et.representationId = $representationId'); params.representationId = input.representationId ?? null; }

    if (!setParts.length) return getEntityType(id);

    const result = await executeQuery(
        `MATCH (et:GrowlEntityType {id: $id}) SET ${setParts.join(', ')} RETURN et`,
        params
    );
    if (!result.records.length) return null;
    return mapEntityType(result.records[0].get('et'));
}

export async function deleteEntityType(id: string): Promise<boolean> {
    const result = await executeQuery(
        `MATCH (et:GrowlEntityType {id: $id}) DETACH DELETE et`,
        { id }
    );
    return result.summary.counters.updates().nodesDeleted > 0;
}

// ── Relationship Types ────────────────────────────────────────────────────────

export async function listRelationshipTypes(projectId: string): Promise<RelationshipType[]> {
    const result = await executeQuery(
        `MATCH (rt:GrowlRelationshipType {projectId: $projectId}) RETURN rt ORDER BY rt.name`,
        { projectId }
    );
    return result.records.map((r) => mapRelationshipType(r.get('rt')));
}

export async function getRelationshipType(id: string): Promise<RelationshipType | null> {
    const result = await executeQuery(
        `MATCH (rt:GrowlRelationshipType {id: $id}) RETURN rt`,
        { id }
    );
    if (!result.records.length) return null;
    return mapRelationshipType(result.records[0].get('rt'));
}

export async function createRelationshipType(
    projectId: string,
    input: CreateRelationshipTypeInput
): Promise<RelationshipType> {
    const id = uuid();
    const fieldsJson = fieldsToJson(input.fields ?? []);
    const representationId = input.representationId ?? null;
    await executeQuery(
        `MATCH (p:GrowlProject {id: $projectId})
         CREATE (rt:GrowlRelationshipType {
           id: $id, projectId: $projectId, name: $name, description: $description,
           sourceEntityTypeId: $sourceEntityTypeId,
           targetEntityTypeId: $targetEntityTypeId,
           fields: $fields, representationId: $representationId
         })
         CREATE (rt)-[:BELONGS_TO]->(p)`,
        {
            projectId, id, name: input.name, description: input.description ?? '',
            sourceEntityTypeId: input.sourceEntityTypeId ?? null,
            targetEntityTypeId: input.targetEntityTypeId ?? null,
            fields: fieldsJson, representationId
        }
    );
    return {
        id, projectId, name: input.name, description: input.description ?? '',
        sourceEntityTypeId: input.sourceEntityTypeId ?? null,
        targetEntityTypeId: input.targetEntityTypeId ?? null,
        fields: parseFields(fieldsJson), representationId
    };
}

export async function updateRelationshipType(
    id: string,
    input: UpdateRelationshipTypeInput
): Promise<RelationshipType | null> {
    const setParts: string[] = [];
    const params: Record<string, unknown> = { id };

    if (input.name !== undefined) { setParts.push('rt.name = $name'); params.name = input.name; }
    if (input.description !== undefined) { setParts.push('rt.description = $description'); params.description = input.description; }
    if ('sourceEntityTypeId' in input) { setParts.push('rt.sourceEntityTypeId = $sourceEntityTypeId'); params.sourceEntityTypeId = input.sourceEntityTypeId ?? null; }
    if ('targetEntityTypeId' in input) { setParts.push('rt.targetEntityTypeId = $targetEntityTypeId'); params.targetEntityTypeId = input.targetEntityTypeId ?? null; }
    if (input.fields !== undefined) { setParts.push('rt.fields = $fields'); params.fields = JSON.stringify(input.fields); }
    if ('representationId' in input) { setParts.push('rt.representationId = $representationId'); params.representationId = input.representationId ?? null; }

    if (!setParts.length) return getRelationshipType(id);

    const result = await executeQuery(
        `MATCH (rt:GrowlRelationshipType {id: $id}) SET ${setParts.join(', ')} RETURN rt`,
        params
    );
    if (!result.records.length) return null;
    return mapRelationshipType(result.records[0].get('rt'));
}

export async function deleteRelationshipType(id: string): Promise<boolean> {
    const result = await executeQuery(
        `MATCH (rt:GrowlRelationshipType {id: $id}) DETACH DELETE rt`,
        { id }
    );
    return result.summary.counters.updates().nodesDeleted > 0;
}
