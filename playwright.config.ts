import { type PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
    webServer: {
        command: 'npm run build && npm run preview',
        port: 4173
    },
    // Tests share a Neo4j instance and are not designed for parallel isolation
    workers: 1,
    globalTeardown: './tests/globalTeardown.ts',
    testDir: 'tests',
    testMatch: /(.+\.)?(test|spec)\.[jt]s/,
    projects: [
        {
            name: 'ui',
            testMatch: 'tests/ui/**/?(*.)+(spec|test).[jt]s'
        },
        {
            name: 'api',
            testMatch: 'tests/api/**/?(*.)+(spec|test).[jt]s'
        }
    ]
};
export default config;
