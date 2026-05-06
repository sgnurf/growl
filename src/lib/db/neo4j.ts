import neo4j from 'neo4j-driver';

const driver = neo4j.driver('neo4j://localhost:7687');

export async function executeQuery(query: string, params?: Record<string, unknown>) {
    return driver.executeQuery(query, params);
}

export default driver;
