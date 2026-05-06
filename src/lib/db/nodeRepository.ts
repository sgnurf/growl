import { executeQuery } from './neo4j';

// Note: project and nodeType are interpolated into Cypher as label names.
// Neo4j does not support parameterized labels, so interpolation is required.
// These values come from the API layer and should be validated there (Phase 1).
const ID_PROP = 'id';

export async function UpsertNode(
    project: string,
    nodeType: string,
    nodeId: string,
    properties: Record<string, unknown> = {}
) {
    const setParts = Object.keys(properties).map((k) => `n.${k} = $${k}`);

    const query = setParts.length
        ? `MERGE (n:${project}:${nodeType} {${ID_PROP}: '${nodeId}'})
           ON CREATE SET ${setParts.join(', ')}
           ON MATCH SET ${setParts.join(', ')}
           RETURN id(n) as id`
        : `MERGE (n:${project}:${nodeType} {${ID_PROP}: '${nodeId}'})
           RETURN id(n) as id`;

    const result = await executeQuery(query, properties as Record<string, unknown>);

    if (!result.records.length) {
        throw new Error(`Node ${nodeId} was not created.`);
    }

    return { id: result.records[0].get('id').toNumber() };
}

export async function DeleteNode(project: string, nodeType: string, nodeId: string) {
    const query = `
        MATCH (n:${project}:${nodeType} {${ID_PROP}: '${nodeId}'})
        DETACH DELETE n
    `;

    const result = await executeQuery(query);
    return { nodeDeleted: result.summary.counters.updates().nodesDeleted > 0 };
}

export async function CreateRelationship(
    project: string,
    relationshipType: string,
    sourceNodeId: string,
    targetNodeId: string,
    properties: Record<string, unknown> = {}
) {
    const propParts = Object.keys(properties).map((k) => `${k}: $${k}`);

    const query = `
        MATCH
            (n1:${project} {${ID_PROP}: '${sourceNodeId}'}),
            (n2:${project} {${ID_PROP}: '${targetNodeId}'})
        CREATE (n1)-[r:${relationshipType} {${propParts.join(', ')}}]->(n2)
        RETURN r
    `;

    return executeQuery(query, properties as Record<string, unknown>);
}

export async function ExecuteQuery(query: string, params?: Record<string, unknown>) {
    return executeQuery(query, params);
}
