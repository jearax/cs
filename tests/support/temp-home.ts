import { afterEach, beforeEach } from 'vitest';

import { makeEmptyDir, removeDir } from './tmp-dir';

const originalHome = process.env['HOME'];

let home = '';

/** The CLI reads the home directory on every path lookup, so a temp HOME redirects every write. */
export const useTempHome = (): { home: () => string } => {
	beforeEach(async () => {
		home = await makeEmptyDir();
		process.env['HOME'] = home;
	});

	afterEach(async () => {
		if (originalHome === undefined) {
			delete process.env['HOME'];
		} else {
			process.env['HOME'] = originalHome;
		}

		await removeDir(home);
	});

	return {
		home: () => {
			return home;
		}
	};
};
