import { describe, expect, it } from 'vitest';

import { runCli } from './support/cli';
import { useTempHome } from './support/temp-home';

useTempHome();

const profileNames = (stdout: string): string[] => {
	const profiles = stdout.slice(stdout.indexOf('Profiles:'));

	return [...profiles.matchAll(/^\s{2}[* ] (\S+)/gm)].map((match) => {
		return match[1]!;
	});
};

describe('cs list', () => {
	it('lists every profile with a masked token', async () => {
		await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-secret-token']);

		const { stdout, exitCode } = await runCli(['list']);

		expect(stdout).toContain('Profiles:');
		expect(stdout).toContain('default');
		expect(stdout).toContain('work');
		expect(stdout).toContain('sk-secre...oken');
		expect(stdout).not.toContain('sk-secret-token');
		expect(exitCode).toBe(0);
	});

	it('answers to the ls alias', async () => {
		await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-secret-token']);

		const { stdout, exitCode } = await runCli(['ls']);

		expect(stdout).toContain('Profiles:');
		expect(stdout).toContain('work');
		expect(exitCode).toBe(0);
	});

	it('masks the oauth token', async () => {
		await runCli(['config', '-n', 'work', '--oauth-token', 'oauth-secret-token']);

		const { stdout } = await runCli(['list']);

		expect(stdout).toContain('oauth-se...oken');
		expect(stdout).not.toContain('oauth-secret-token');
	});

	it('marks the active profile with a star', async () => {
		await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-secret-token']);
		await runCli(['use', 'work']);

		const { stdout } = await runCli(['list']);

		expect(stdout).toContain('* work');
	});

	it('marks a profile that has a rendered file', async () => {
		await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-secret-token']);

		const { stdout } = await runCli(['list']);

		expect(stdout).toContain('work [rendered]');
	});

	it('sorts profiles default first, then A→Z case-insensitively', async () => {
		await runCli(['config', '-n', 'zeta', '-u', 'https://example.com', '-t', 'sk-secret-token']);
		await runCli(['config', '-n', 'Alpha', '-u', 'https://example.com', '-t', 'sk-secret-token']);
		await runCli(['config', '-n', 'beta', '-u', 'https://example.com', '-t', 'sk-secret-token']);

		const { stdout } = await runCli(['list']);

		expect(profileNames(stdout)).toEqual(['default', 'Alpha', 'beta', 'zeta']);
	});

	it('keeps default first even when another name sorts before it', async () => {
		await runCli(['config', '-n', 'aaa', '-u', 'https://example.com', '-t', 'sk-secret-token']);

		const { stdout } = await runCli(['list']);

		expect(profileNames(stdout)).toEqual(['default', 'aaa']);
	});

	it('sorts Alpha before alpha with the code-point tie-break', async () => {
		await runCli(['config', '-n', 'alpha', '-u', 'https://example.com', '-t', 'sk-secret-token']);
		await runCli(['config', '-n', 'Alpha', '-u', 'https://example.com', '-t', 'sk-secret-token']);

		const { stdout } = await runCli(['list']);

		expect(profileNames(stdout)).toEqual(['default', 'Alpha', 'alpha']);
	});

	it('sorts aliases A→Z', async () => {
		await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-secret-token']);
		await runCli(['alias', 'zeta-alias', 'work']);
		await runCli(['alias', 'alpha-alias', 'work']);

		const { stdout } = await runCli(['list']);
		const aliases = stdout.slice(stdout.indexOf('Aliases:'));

		const names = [...aliases.matchAll(/^\s{2}(\S+) →/gm)].map((match) => {
			return match[1]!;
		});

		expect(names).toEqual(['alpha-alias', 'zeta-alias']);
	});
});
