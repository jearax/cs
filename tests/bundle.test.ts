import { execFile } from 'node:child_process';
import { copyFile, readFile, symlink } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { makeEmptyDir, removeDir } from './support/tmp-dir';

const run = promisify(execFile);
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const pkg = JSON.parse(await readFile(resolve(projectRoot, 'package.json'), 'utf8')) as {
	version: string;
};

describe('standalone bundle', () => {
	let sandbox: string;

	beforeAll(async () => {
		sandbox = await makeEmptyDir();
		await copyFile(resolve(projectRoot, 'dist/cli.mjs'), resolve(sandbox, 'cli.mjs'));
	});

	afterAll(async () => {
		await removeDir(sandbox);
	});

	const runEntry = async (
		entry: string,
		args: readonly string[],
		cwd: string = sandbox
	): Promise<{ stdout: string; stderr: string; code: number }> => {
		try {
			const { stdout, stderr } = await run(process.execPath, [resolve(sandbox, entry), ...args], { cwd });

			return {
				stdout,
				stderr,
				code: 0
			};
		} catch (error) {
			const failure = error as { stdout?: string; stderr?: string; code?: number };

			return {
				stdout: failure.stdout ?? '',
				stderr: failure.stderr ?? '',
				code: failure.code ?? -1
			};
		}
	};

	const cli = async (...args: readonly string[]): Promise<{ stdout: string; stderr: string; code: number }> => {
		return runEntry('cli.mjs', args);
	};

	it('has no node_modules to resolve runtime dependencies from', async () => {
		const { stdout } = await run(
			process.execPath,
			['-e', "console.log(require('node:fs').existsSync('node_modules'))"],
			{
				cwd: sandbox
			}
		);

		expect(stdout.trim()).toBe('false');
	});

	it('prints help', async () => {
		const { stdout, code } = await cli('--help');

		expect(code).toBe(0);
		expect(stdout).toContain('Usage: cs');
	});

	it('prints a version', async () => {
		const { stdout, code } = await cli('--version');

		expect(code).toBe(0);
		expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);
	});

	it('prints the version alone when the output is piped', async () => {
		const { stdout, code } = await cli('--version');

		expect(code).toBe(0);
		expect(stdout).toBe(`${pkg.version}\n`);
	});

	it('prints the version alone for -v when the output is piped', async () => {
		const { stdout, code } = await cli('-v');

		expect(code).toBe(0);
		expect(stdout).toBe(`${pkg.version}\n`);
	});

	it('prints the help for -h', async () => {
		const { stdout, code } = await cli('-h');

		expect(code).toBe(0);
		expect(stdout).toContain('Usage: cs');
	});

	it('rejects -V, the flag commander uses for the version by default', async () => {
		const { stderr, code } = await cli('-V');

		expect(code).not.toBe(0);
		expect(stderr).toContain("unknown option '-V'");
	});

	it('exits non-zero on an unknown command', async () => {
		const { code } = await cli('nope');

		expect(code).toBe(1);
	});

	it('shows the help on stdout and exits 0 with no command', async () => {
		const { stdout, stderr, code } = await cli();

		expect(code).toBe(0);
		expect(stdout).toContain('Usage: cs');
		expect(stderr).toBe('');
	});

	it('runs through a symlink, the way bin shims and installers link it', async () => {
		await symlink(resolve(sandbox, 'cli.mjs'), resolve(sandbox, 'cs'));

		const version = await runEntry('cs', ['--version']);
		const unknown = await runEntry('cs', ['nope']);

		expect(version.code).toBe(0);
		expect(version.stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);
		expect(unknown.code).toBe(1);
	});
});
