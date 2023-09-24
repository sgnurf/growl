import { ExecuteQuery } from '../../src/lib/services/neo4jQueryExecutor';
import { test as setup } from '@playwright/test';
import { projectName } from './apiTestConfig';

setup('Clear Database of test data', async ({ page }) => {
    ExecuteQuery(`MATCH (n:${projectName}) DETACH DELETE n`);
});