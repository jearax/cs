import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import { csConfigPath, launcherPath } from '@/modules/profiles/constants/paths.constant';

import { runCli } from './support/cli';
import { useTempHome } from './support/temp-home';

useTempHome();

const exists = async (path: string): Promise<boolean> => {
	try {
		await readFile(path);

		return true;
	} catch {
		return false;
	}
};

const readAliases = async (): Promise<Record<string, string>> => {
	const config = JSON.parse(await readFile(csConfigPath(), 'utf8')) as {
		aliases?: Record<string, string>;
	};

	return config.aliases ?? {};
};

const seedProfile = async (name: string): Promise<void> => {
	await runCli(['config', '-n', name, '-u', `https://${name}.example.com`, '-t', 'sk-fake-token']);
};

describe('the alias launcher', () => {
	it('carries no secret of its own', async () => {
		await seedProfile('work');
		await runCli(['alias', 'planner', 'work']);

		const launcher = await readFile(launcherPath('planner'), 'utf8');

		expect(launcher).toContain('~/.config/cs/profiles/work.json');
		expect(launcher).not.toContain('sk-fake-token');
	});

	it('survives a change of the profile it points at', async () => {
		await seedProfile('work');
		await runCli(['alias', 'planner', 'work']);

		await runCli(['config', '-n', 'work', '-u', 'https://changed.example.com', '-t', 'sk-other-token']);

		expect(await exists(launcherPath('planner'))).toBe(true);

		const launcher = await readFile(launcherPath('planner'), 'utf8');

		expect(launcher).toContain('~/.config/cs/profiles/work.json');
		expect(await readAliases()).toEqual({ planner: 'work' });
	});

	it('is cleaned when the profile it points at is removed', async () => {
		await seedProfile('work');
		await runCli(['alias', 'planner', 'work']);

		const { stdout, exitCode } = await runCli(['remove', 'work']);

		expect(stdout).toContain('Profile "work" removed.');
		expect(stdout).toContain('Removed aliases: planner');
		expect(exitCode).toBe(0);

		expect(await readAliases()).toEqual({});
		expect(await exists(launcherPath('planner'))).toBe(false);
	});

	it('keeps an alias that points at another profile when one profile is removed', async () => {
		await seedProfile('work');
		await seedProfile('other');
		await runCli(['alias', 'planner', 'work']);
		await runCli(['alias', 'cooker', 'other']);

		await runCli(['remove', 'work']);

		expect(await readAliases()).toEqual({ cooker: 'other' });
		expect(await exists(launcherPath('cooker'))).toBe(true);
		expect(await exists(launcherPath('planner'))).toBe(false);
	});

	it('is cleared with the whole map on reset', async () => {
		await seedProfile('work');
		await runCli(['alias', 'planner', 'work']);
		await runCli(['alias', 'cooker', 'work']);

		const { stdout, exitCode } = await runCli(['reset']);

		expect(stdout).toContain('Removed aliases: planner, cooker');
		expect(exitCode).toBe(0);

		expect(await readAliases()).toEqual({});
		expect(await exists(launcherPath('planner'))).toBe(false);
		expect(await exists(launcherPath('cooker'))).toBe(false);
	});

	it('is listed as a row of its target profile', async () => {
		await seedProfile('work');
		await runCli(['alias', 'planner', 'work']);

		const { stdout } = await runCli(['list']);

		expect(stdout).toContain('Aliases:');
		expect(stdout).toContain('planner → work');
	});

	it('keeps an alias pointed at its target when a profile takes the same name', async () => {
		await seedProfile('work');
		await runCli(['alias', 'planner', 'work']);

		const { exitCode } = await runCli(['config', '-n', 'planner', '-u', 'https://x.example.com']);

		expect(exitCode).toBe(0);

		const launcher = await readFile(launcherPath('planner'), 'utf8');

		expect(launcher).toContain('exec claude --settings ~/.config/cs/profiles/work.json');
	});
});
