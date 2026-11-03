import { defineConfig } from 'vitest/config';

import { readPackageInfo } from './scripts/package-info.mjs';

const vitestConfig = defineConfig({
	define: {
		__CS_PACKAGE__: JSON.stringify(readPackageInfo())
	},
	resolve: {
		tsconfigPaths: true
	},
	test: {
		environment: 'node',
		include: ['tests/**/*.test.ts'],
		globalSetup: ['tests/setup/global-setup.ts']
	}
});

export default vitestConfig;
