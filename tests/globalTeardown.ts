import { executeQuery } from '../src/lib/db/neo4j';
import driver from '../src/lib/db/neo4j';
import { TEST_PREFIX } from './testConfig';

export default async function globalTeardown() {
    try {
        const projectResult = await executeQuery(
            `MATCH (p:GrowlProject) WHERE p.name STARTS WITH $prefix RETURN p.id AS id`,
            { prefix: TEST_PREFIX }
        );
        const testProjectIds = projectResult.records.map((r) => r.get('id') as string);

        if (testProjectIds.length > 0) {
            await executeQuery(
                `MATCH (e:GrowlEntity) WHERE e.projectId IN $ids DETACH DELETE e`,
                { ids: testProjectIds }
            );
            await executeQuery(
                `MATCH (et:GrowlEntityType) WHERE et.projectId IN $ids DETACH DELETE et`,
                { ids: testProjectIds }
            );
            await executeQuery(
                `MATCH (rt:GrowlRelationshipType) WHERE rt.projectId IN $ids DETACH DELETE rt`,
                { ids: testProjectIds }
            );
        }

        await executeQuery(
            `MATCH (p:GrowlProject) WHERE p.name STARTS WITH $prefix DETACH DELETE p`,
            { prefix: TEST_PREFIX }
        );
    } finally {
        await driver.close();
    }
}
