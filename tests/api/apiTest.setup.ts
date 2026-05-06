import { ExecuteQuery } from '../../src/lib/db/nodeRepository';
import { test as setup } from '@playwright/test';
import { projectName } from './apiTestConfig';

setup('Clear Database of test data', async () => {
    ExecuteQuery(`MATCH (n:${projectName}) DETACH DELETE n`);
});
