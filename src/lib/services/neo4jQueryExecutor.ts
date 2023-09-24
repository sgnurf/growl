import neo4j from 'neo4j-driver';

const driver = neo4j.driver(
    'neo4j://localhost:7687'
)

const idPropertyName = 'id';

async function executeQuery(query: string, params?: Record<string, any>) {
    return driver.executeQuery(query, params);
}

export async function CreatedNode(project: string, nodeType: string, nodeId: string, properties: Record<string, any>) {

    let propertiesQuery: string[] = [];
    propertiesQuery.push(`${idPropertyName}: '${nodeId}'`);

    for (const key in properties) {
        propertiesQuery.push(`${key}: $${key}`);
    };

    const query = `
            CREATE (n:${project}:${nodeType} {${propertiesQuery.join(',')}})
            RETURN id(n) as id
        `;

    const queryResult = await executeQuery(query, properties);

    if (!queryResult.records.length) {
        throw new Error(`Node ${nodeId} not created. ${queryResult}`);
    }

    return { id: queryResult.records[0].get('id').toNumber() };
}

export async function UpsertNode(project: string, nodeType: string, nodeId: string, properties: Record<string, any>) {

    let propertiesQuery: string[] = [];

    for (const key in properties) {
        propertiesQuery.push(`n.${key}= $${key}`);
    };

    const query =
        propertiesQuery.length ?
            `MERGE (n:${project}:${nodeType} {${idPropertyName}: '${nodeId}'})
                ON CREATE SET ${propertiesQuery.join(',')}
                ON MATCH SET ${propertiesQuery.join(',')}
            RETURN id(n) as id`
            : `MERGE (n:${project}:${nodeType} {${idPropertyName}: '${nodeId}'})
            RETURN id(n) as id`


    const queryResult = await executeQuery(query, properties);

    if (!queryResult.records.length) {
        throw new Error(`Node ${nodeId} not created. ${queryResult}`);
    }

    return { id: queryResult.records[0].get('id').toNumber() };
}

export async function DeleteNode(project: string, nodeType: string, nodeId: string) {

    const query = `
            MATCH (n:${project}:${nodeType} {${idPropertyName}: '${nodeId}'})
            DETACH DELETE n
        `;

    const queryResult = await executeQuery(query);
    return { nodeDeleted: queryResult.summary.counters.updates().nodesDeleted > 0 };
}

export async function CreateRelationship(project: string, relationshipType: string, sourceNodeId: string, targetNodeId: string, properties: Record<string, any>) {

    let propertiesQuery: string[] = [];

    for (const key in properties) {
        propertiesQuery.push(`${key}: $${key}`);
    };

    const query = `
            MATCH  
                (n1:${project} {${idPropertyName}: '${sourceNodeId}'}),
                (n2:${project} {${idPropertyName}: '${targetNodeId}'})
            CREATE (n1)-[r:${relationshipType} {${propertiesQuery.join(',')}}]->(n2)
            RETURN r
        `;

    return await executeQuery(query, properties);
}

export async function UpdateRelationship(relationshipId: number, properties: Record<string, any>) {

    let propertiesQuery: string[] = [];

    for (const key in properties) {
        propertiesQuery.push(`rel.${key}= $${key}`);
    };

    const query = `
            MATCH (r)-[rel]->(n)
            WHERE id(rel) = ${relationshipId}
            SET ${propertiesQuery.join(',')}
        `;

    return await executeQuery(query, properties);
}

export async function DeleteRelationship(relationshipId: number) {

    const query = `
            MATCH (r)-[rel]->(n)
            WHERE id(rel) = ${relationshipId}
            DELETE rel
        `;

    return await executeQuery(query);
}

export async function ExecuteQuery(query: string, params?: Record<string, any>) {
    const queryResult = await executeQuery(query, params);

    queryResult.records.forEach(record => {
        record.forEach((value, _) => {
            //console.log(`${key}: ${value}`);
        });
    });
    
    return queryResult;
}