import { ExecuteQuery } from '../../src/lib/db/nodeRepository';
import { test as setup } from '@playwright/test';
import { projectName } from './apiTestConfig';

setup('Clear Database of test data', async () => {
    // Legacy graph test data
    await ExecuteQuery(`MATCH (n:${projectName}) DETACH DELETE n`);
    // Growl meta nodes (entity/relationship types must go before projects to avoid orphans)
    await ExecuteQuery(`MATCH (n:GrowlEntityType) DETACH DELETE n`);
    await ExecuteQuery(`MATCH (n:GrowlRelationshipType) DETACH DELETE n`);
    await ExecuteQuery(`MATCH (n:GrowlProject) DETACH DELETE n`);
    await ExecuteQuery(`MATCH (n:GrowlUser) DETACH DELETE n`);
});
