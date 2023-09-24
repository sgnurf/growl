import { defineConfig, type PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173
	},
	testDir: 'tests',
	testMatch: /(.+\.)?(test|spec)\.[jt]s/,
	projects: [
		{
			name: 'ui',
			testMatch: 'tests/ui/**/?(*.)+(spec|test).[jt]s',
		},
		{
			name: 'api',
			testMatch: 'tests/api/**/?(*.)+(spec|test).[jt]s',
			dependencies: ['apiSetup'],
		},
		{
			name: 'apiSetup',
			testMatch: 'tests/api/apiTest.setup.ts',
		},
	]
};
export default config;
