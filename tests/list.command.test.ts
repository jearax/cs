import { describe, expect, it } from 'vitest';

import { runCli } from './support/cli';
import { useTempHome } from './support/temp-home';

useTempHome();

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
});
