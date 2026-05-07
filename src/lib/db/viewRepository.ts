import { executeQuery } from './neo4j';
import type { View, CreateViewInput, UpdateViewInput, ViewFilter, NodePosition } from '$lib/views/types';

function uuid(): string {
    return crypto.randomUUID();
}

function now(): string {
    return new Date().toISOString();
}

function parseFilter(json: string | null | undefined): ViewFilter {
    if (!json) return { entityTypeIds: [], relationshipTypeIds: [] };
    try {
        return JSON.parse(json);
    } catch {
        return { entityTypeIds: [], relationshipTypeIds: [] };
    }
}

function parsePositions(json: string | null | undefined): Record<string, NodePosition> {
    if (!json) return {};
    try {
        return JSON.parse(json);
    } catch {
        return {};
    }
}

function mapView(node: { properties: Record<string, string> }): View {
    const v = node.properties;
    return {
        id: v.id,
        projectId: v.projectId,
        name: v.name,
        filter: parseFilter(v.filter),
        positions: parsePositions(v.positions),
        createdAt: v.createdAt,
        updatedAt: v.updatedAt
    };
}

export async function listViews(projectId: string): Promise<View[]> {
    const result = await executeQuery(
        `MATCH (v:GrowlView {projectId: $projectId}) RETURN v ORDER BY v.createdAt`,
        { projectId }
    );
    return result.records.map((r) => mapView(r.get('v')));
}

export async function getView(id: string): Promise<View | null> {
    const result = await executeQuery(
        `MATCH (v:GrowlView {id: $id}) RETURN v`,
        { id }
    );
    if (!result.records.length) return null;
    return mapView(result.records[0].get('v'));
}

export async function createView(projectId: string, input: CreateViewInput): Promise<View> {
    const id = uuid();
    const ts = now();
    const filter: ViewFilter = {
        entityTypeIds: input.filter?.entityTypeIds ?? [],
        relationshipTypeIds: input.filter?.relationshipTypeIds ?? []
    };
    const filterJson = JSON.stringify(filter);
    const positionsJson = JSON.stringify({});
    await executeQuery(
        `MATCH (p:GrowlProject {id: $projectId})
         CREATE (v:GrowlView {
           id: $id, projectId: $projectId, name: $name,
           filter: $filter, positions: $positions,
           createdAt: $createdAt, updatedAt: $updatedAt
         })
         CREATE (v)-[:BELONGS_TO]->(p)`,
        {
            projectId, id, name: input.name,
            filter: filterJson, positions: positionsJson,
            createdAt: ts, updatedAt: ts
        }
    );
    return { id, projectId, name: input.name, filter, positions: {}, createdAt: ts, updatedAt: ts };
}

export async function updateView(id: string, input: UpdateViewInput): Promise<View | null> {
    const ts = now();
    const setParts: string[] = ['v.updatedAt = $updatedAt'];
    const params: Record<string, unknown> = { id, updatedAt: ts };

    if (input.name !== undefined) {
        setParts.push('v.name = $name');
        params.name = input.name;
    }
    if (input.filter !== undefined) {
        setParts.push('v.filter = $filter');
        params.filter = JSON.stringify({
            entityTypeIds: input.filter.entityTypeIds ?? [],
            relationshipTypeIds: input.filter.relationshipTypeIds ?? []
        });
    }

    const result = await executeQuery(
        `MATCH (v:GrowlView {id: $id}) SET ${setParts.join(', ')} RETURN v`,
        params
    );
    if (!result.records.length) return null;
    return mapView(result.records[0].get('v'));
}

export async function saveViewPositions(
    id: string,
    positions: Record<string, NodePosition>
): Promise<View | null> {
    const ts = now();
    const result = await executeQuery(
        `MATCH (v:GrowlView {id: $id}) SET v.positions = $positions, v.updatedAt = $updatedAt RETURN v`,
        { id, positions: JSON.stringify(positions), updatedAt: ts }
    );
    if (!result.records.length) return null;
    return mapView(result.records[0].get('v'));
}

export async function deleteView(id: string): Promise<boolean> {
    const result = await executeQuery(
        `MATCH (v:GrowlView {id: $id}) DETACH DELETE v`,
        { id }
    );
    return result.summary.counters.updates().nodesDeleted > 0;
}
