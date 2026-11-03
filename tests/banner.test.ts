import { stripVTControlCharacters } from 'node:util';

import { afterEach, describe, expect, it } from 'vitest';

import { main } from '@/cli';
import { PACKAGE } from '@/core/constants/package.constant';
import { renderBanner, showBanner } from '@/core/ui/banner.ui';

import { capture } from './support/capture-stream';

const info = {
	name: PACKAGE.name,
	version: PACKAGE.version,
	description: PACKAGE.description,
	node: `v${PACKAGE.nodeFloor}`,
	platform: 'darwin',
	arch: 'arm64'
};

const streamWithDepth = (depth: number): { isTTY: boolean; getColorDepth: () => number } => {
	return {
		isTTY: true,
		getColorDepth: () => {
			return depth;
		}
	};
};

const originalForceColor = process.env['FORCE_COLOR'];

afterEach(() => {
	if (originalForceColor === undefined) {
		delete process.env['FORCE_COLOR'];
	} else {
		process.env['FORCE_COLOR'] = originalForceColor;
	}
});

describe('banner', () => {
	it('lines the info column up on every line it occupies', () => {
		const lines = stripVTControlCharacters(renderBanner(info)).split('\n');

		const columns = [lines[1]?.indexOf(info.name), lines[2]?.indexOf(info.description), lines[4]?.indexOf('Node.js ')];

		expect(columns[0]).toBeGreaterThan(0);
		expect(
			columns.every((column) => {
				return column === columns[0];
			})
		).toBe(true);
	});

	it('shows the name, the version, the description, the node version and the platform', () => {
		const banner = stripVTControlCharacters(renderBanner(info));

		expect(banner).toContain(`${PACKAGE.name} v${PACKAGE.version}`);
		expect(banner).toContain(PACKAGE.description);
		expect(banner).toContain(`Node.js v${PACKAGE.nodeFloor} · macOS arm64`);
	});

	it('draws the CS block letters', () => {
		const banner = stripVTControlCharacters(renderBanner(info));

		expect(banner).toContain('██╔════╝██╔════╝');
		expect(banner).toContain('╚██████╗███████║');
	});

	it('colours the end stops in truecolor and dims the shadow characters at depth 24', () => {
		const banner = renderBanner(info, {}, streamWithDepth(24));

		expect(banner).toContain('\u001b[38;2;168;213;88m');
		expect(banner).toContain('\u001b[38;2;94;140;4;2m');
		expect(
			banner.split('\u001b[').some((sequence) => {
				return sequence.startsWith('38;2;') && sequence.includes(';2m');
			})
		).toBe(true);
	});

	it('uses only 256-colour codes at depth 8', () => {
		const banner = renderBanner(info, {}, streamWithDepth(8));

		expect(banner).toContain('38;5;');
		expect(banner).not.toContain('38;2;');
	});

	it('uses one 16-colour code at depth 4', () => {
		const banner = renderBanner(info, {}, streamWithDepth(4));

		expect(banner).toContain('\u001b[32m');
		expect(banner).toContain('\u001b[32;2m');
		expect(banner).not.toContain('38;2;');
		expect(banner).not.toContain('38;5;');
	});

	it('has no escape code under NO_COLOR', () => {
		const stream = {
			isTTY: true,
			getColorDepth: (env: NodeJS.ProcessEnv) => {
				return env['NO_COLOR'] ? 1 : 24;
			}
		};

		expect(renderBanner(info, { NO_COLOR: '1' }, stream)).not.toContain('\u001b');
	});

	it('fits in eighty columns', () => {
		const lines = stripVTControlCharacters(renderBanner(info)).split('\n');

		expect(
			Math.max(
				...lines.map((line) => {
					return line.length;
				})
			)
		).toBeLessThanOrEqual(80);
	});

	it('has no escape code when the colour is off', () => {
		process.env['FORCE_COLOR'] = '0';

		expect(renderBanner(info)).not.toContain('\u001b');
	});
});

describe('showing the banner', () => {
	it('writes the banner on a terminal', async () => {
		const output = await capture(process.stdout, () => {
			showBanner({
				isTTY: true,
				env: {},
				columns: 80
			});
		});

		expect(output).toContain(`${PACKAGE.name} v${PACKAGE.version}`);
	});

	it('writes nothing when the output is piped', async () => {
		const output = await capture(process.stdout, () => {
			showBanner({
				isTTY: false,
				env: {}
			});
		});

		expect(output).toBe('');
	});

	it('writes nothing under CI', async () => {
		const output = await capture(process.stdout, () => {
			showBanner({
				isTTY: true,
				env: { CI: 'true' }
			});
		});

		expect(output).toBe('');
	});
});

describe('the banner in the CLI', () => {
	const originalIsTTY = Object.getOwnPropertyDescriptor(process.stdout, 'isTTY');
	const originalColumns = Object.getOwnPropertyDescriptor(process.stdout, 'columns');
	const originalCi = process.env['CI'];

	afterEach(() => {
		if (originalIsTTY === undefined) {
			Reflect.deleteProperty(process.stdout, 'isTTY');
		} else {
			Object.defineProperty(process.stdout, 'isTTY', originalIsTTY);
		}

		if (originalColumns === undefined) {
			Reflect.deleteProperty(process.stdout, 'columns');
		} else {
			Object.defineProperty(process.stdout, 'columns', originalColumns);
		}

		if (originalCi === undefined) {
			delete process.env['CI'];
		} else {
			process.env['CI'] = originalCi;
		}
	});

	const onATerminal = async (fn: () => Promise<void>): Promise<string> => {
		Object.defineProperty(process.stdout, 'isTTY', {
			value: true,
			configurable: true,
			writable: true
		});
		Object.defineProperty(process.stdout, 'columns', {
			value: 80,
			configurable: true,
			writable: true
		});
		delete process.env['CI'];

		return capture(process.stdout, fn);
	};

	it('shows the banner before the version', async () => {
		const output = await onATerminal(async () => {
			await main(['node', 'cs', '--version'], { exitOverride: true });
		});

		expect(output).toContain('██╔════╝██╔════╝');
		expect(output).toContain(`${PACKAGE.name} v${PACKAGE.version}`);
		expect(output.indexOf('██╔════╝██╔════╝')).toBeLessThan(output.indexOf(`${PACKAGE.name} v${PACKAGE.version}`));
	});

	it('shows the banner above the help', async () => {
		const output = await onATerminal(async () => {
			await main(['node', 'cs', '--help'], { exitOverride: true });
		});

		expect(output).toContain('██╔════╝██╔════╝');
		expect(output).toContain('Usage: cs');
		expect(output.indexOf('██╔════╝██╔════╝')).toBeLessThan(output.indexOf('Usage: cs'));
	});

	it('shows the banner on a bare run', async () => {
		const output = await onATerminal(async () => {
			await main(['node', 'cs'], { exitOverride: true });
		});

		expect(output).toContain('██╔════╝██╔════╝');
		expect(output).toContain('Usage: cs');
	});

	it('shows no banner when the output is piped', async () => {
		const output = await capture(process.stdout, async () => {
			await main(['node', 'cs', '--help'], { exitOverride: true });
		});

		expect(output).not.toContain('██╔════╝██╔════╝');
		expect(output).toContain('Usage: cs');
	});
});
