import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ensureBinPath } from '@/modules/profiles/services/ensure-bin-path.service';
import { POSIX_EXPORT_LINE, RC_PATH_MARKER } from '@/modules/profiles/services/rc-path.service';

import { runCli } from './support/cli';
import { useTempHome } from './support/temp-home';

const { home } = useTempHome();

const zshRc = (): string => {
	return join(home(), '.zshrc');
};

const readRc = async (path: string): Promise<string> => {
	return readFile(path, 'utf8');
};

const seedLauncher = async (): Promise<void> => {
	const dir = join(home(), '.config', 'cs', 'bin');

	await mkdir(dir, { recursive: true });
	await writeFile(join(dir, 'claude-planner'), '#!/bin/sh\nexec claude --settings ~/.config/cs/profiles/work.json\n', {
		mode: 0o755
	});
};

describe('the PATH service', () => {
	it('does nothing when the bin dir holds no launcher', async () => {
		const outcome = await ensureBinPath({
			home: home(),
			shell: '/bin/zsh',
			path: '/usr/bin:/bin',
			interactive: true
		});

		expect(outcome).toBeNull();
		expect(
			await readRc(zshRc()).catch(() => {
				return '';
			})
		).toBe('');
	});

	it('appends the marked block to the rc file of the shell', async () => {
		await seedLauncher();

		const outcome = await ensureBinPath({
			home: home(),
			shell: '/bin/zsh',
			path: '/usr/bin:/bin',
			interactive: true
		});

		expect(outcome?.status).toBe('added');
		expect(outcome?.rcPath).toBe('~/.zshrc');
		expect(await readRc(zshRc())).toBe(`\n${RC_PATH_MARKER}\n${POSIX_EXPORT_LINE}\n`);
	});

	it('writes nothing on a second run', async () => {
		await seedLauncher();

		const options = {
			home: home(),
			shell: '/bin/zsh',
			path: '/usr/bin:/bin',
			interactive: true
		};

		await ensureBinPath(options);

		const outcome = await ensureBinPath(options);

		expect(outcome?.status).toBe('marker-present');
		expect(await readRc(zshRc())).toBe(`\n${RC_PATH_MARKER}\n${POSIX_EXPORT_LINE}\n`);
	});

	it('skips the write when the bin dir is already in the PATH', async () => {
		await seedLauncher();

		const outcome = await ensureBinPath({
			home: home(),
			shell: '/bin/zsh',
			path: `/usr/bin:${join(home(), '.config', 'cs', 'bin')}`,
			interactive: true
		});

		expect(outcome?.status).toBe('already-in-path');
		expect(
			await readRc(zshRc()).catch(() => {
				return '';
			})
		).toBe('');
	});

	it('writes nothing outside an interactive terminal', async () => {
		await seedLauncher();

		const outcome = await ensureBinPath({
			home: home(),
			shell: '/bin/zsh',
			path: '/usr/bin:/bin',
			interactive: false
		});

		expect(outcome?.status).toBe('not-interactive');
		expect(outcome?.rcPath).toBe('~/.zshrc');
		expect(
			await readRc(zshRc()).catch(() => {
				return '';
			})
		).toBe('');
	});

	it('writes nothing for a shell cs does not know', async () => {
		await seedLauncher();

		const outcome = await ensureBinPath({
			home: home(),
			shell: '/bin/tcsh',
			path: '/usr/bin:/bin',
			interactive: true
		});

		expect(outcome?.status).toBe('unsupported-shell');
		expect(outcome?.rcPath).toBeNull();
		expect(
			await readRc(zshRc()).catch(() => {
				return '';
			})
		).toBe('');
	});

	it('leaves a file that already carries the marker alone', async () => {
		await seedLauncher();

		const existing = `# my shell config\n${RC_PATH_MARKER}\nexport PATH="$HOME/.config/cs/bin:$PATH"\n`;

		await writeFile(zshRc(), existing);

		const outcome = await ensureBinPath({
			home: home(),
			shell: '/bin/zsh',
			path: '/usr/bin:/bin',
			interactive: true
		});

		expect(outcome?.status).toBe('marker-present');
		expect(await readRc(zshRc())).toBe(existing);
	});

	it('separates the block from the rc content with one blank line', async () => {
		await seedLauncher();
		await writeFile(zshRc(), 'export FOO=1');

		await ensureBinPath({
			home: home(),
			shell: '/bin/zsh',
			path: '/usr/bin:/bin',
			interactive: true
		});

		const content = await readRc(zshRc());

		expect(content).toBe(`export FOO=1\n\n${RC_PATH_MARKER}\n${POSIX_EXPORT_LINE}\n`);
	});

	it('keeps one blank line when the rc file already ends with a newline', async () => {
		await seedLauncher();
		await writeFile(zshRc(), 'export FOO=1\n');

		await ensureBinPath({
			home: home(),
			shell: '/bin/zsh',
			path: '/usr/bin:/bin',
			interactive: true
		});

		const content = await readRc(zshRc());

		expect(content).toBe(`export FOO=1\n\n${RC_PATH_MARKER}\n${POSIX_EXPORT_LINE}\n`);
	});

	it('writes the fish block to the fish config', async () => {
		await seedLauncher();

		const outcome = await ensureBinPath({
			home: home(),
			shell: '/usr/bin/fish',
			path: '/usr/bin:/bin',
			interactive: true
		});

		expect(outcome?.status).toBe('added');
		expect(outcome?.rcPath).toBe('~/.config/fish/config.fish');
		expect(await readRc(join(home(), '.config', 'fish', 'config.fish'))).toBe(
			`\n${RC_PATH_MARKER}\nfish_add_path $HOME/.config/cs/bin\n`
		);
	});
});

const originalShell = process.env['SHELL'];
const originalIsTty = Object.getOwnPropertyDescriptor(process.stdout, 'isTTY');
const originalColumns = Object.getOwnPropertyDescriptor(process.stdout, 'columns');
const originalCi = process.env['CI'];

const setTty = (value: boolean): void => {
	Object.defineProperty(process.stdout, 'isTTY', {
		value,
		configurable: true
	});
	Object.defineProperty(process.stdout, 'columns', {
		value: 80,
		configurable: true
	});
};

describe('the PATH service through the CLI', () => {
	beforeEach(() => {
		process.env['SHELL'] = '/bin/zsh';

		if (originalCi !== undefined) {
			delete process.env['CI'];
		}
	});

	afterEach(() => {
		if (originalShell === undefined) {
			delete process.env['SHELL'];
		} else {
			process.env['SHELL'] = originalShell;
		}

		if (originalCi !== undefined) {
			process.env['CI'] = originalCi;
		}

		if (originalIsTty === undefined) {
			Reflect.deleteProperty(process.stdout, 'isTTY');
		} else {
			Object.defineProperty(process.stdout, 'isTTY', originalIsTty);
		}

		if (originalColumns === undefined) {
			Reflect.deleteProperty(process.stdout, 'columns');
		} else {
			Object.defineProperty(process.stdout, 'columns', originalColumns);
		}
	});

	it('stays silent while no alias launcher exists', async () => {
		setTty(true);

		const { stdout } = await runCli(['config', '-n', 'work', '-u', 'https://example.com']);

		expect(stdout).not.toContain('PATH entry added');
		expect(stdout).not.toContain('Add ~/.config/cs/bin to your PATH');
		expect(
			await readRc(zshRc()).catch(() => {
				return '';
			})
		).toBe('');
	});

	it('appends the block and says so when the terminal is interactive', async () => {
		setTty(true);

		await runCli(['config', '-n', 'work', '-u', 'https://example.com']);

		const { stdout } = await runCli(['alias', 'planner', 'work']);

		expect(stdout).toContain('PATH entry added to ~/.zshrc');
		expect(await readRc(zshRc())).toBe(`\n${RC_PATH_MARKER}\n${POSIX_EXPORT_LINE}\n`);
	});

	it('prints the hint and touches nothing when the terminal is not interactive', async () => {
		setTty(false);

		await runCli(['config', '-n', 'work', '-u', 'https://example.com']);

		const { stdout } = await runCli(['alias', 'planner', 'work']);

		expect(stdout).toContain('Add ~/.config/cs/bin to your PATH');
		expect(stdout).toContain(POSIX_EXPORT_LINE);
		expect(
			await readRc(zshRc()).catch(() => {
				return '';
			})
		).toBe('');
	});
});
