import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import { csConfigPath, launcherPath, profileArtifactPath } from '@/modules/profiles/constants/paths.constant';

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

describe('cs remove', () => {
	it('removes the profile with its artifact and its launcher', async () => {
		await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-secret-token']);

		const { stdout, exitCode } = await runCli(['remove', 'work']);

		expect(stdout).toContain('Profile "work" removed.');
		expect(exitCode).toBe(0);

		const config = JSON.parse(await readFile(csConfigPath(), 'utf8')) as {
			profiles: Record<string, unknown>;
		};

		expect(config.profiles['work']).toBeUndefined();
		expect(await exists(profileArtifactPath('work'))).toBe(false);
		expect(await exists(launcherPath('work'))).toBe(false);
	});

	it('clears the current profile when the active one is removed', async () => {
		await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-secret-token']);
		await runCli(['use', 'work']);

		await runCli(['remove', 'work']);

		const config = JSON.parse(await readFile(csConfigPath(), 'utf8')) as { currentProfile?: string };

		expect(config.currentProfile).toBeUndefined();
	});

	it('names the missing argument as a profile', async () => {
		const { stderr, exitCode } = await runCli(['remove']);

		expect(stderr).toContain("missing required argument 'profile'");
		expect(exitCode).toBe(1);
	});

	it('shows the profile placeholder in its help', async () => {
		const { stdout } = await runCli(['remove', '--help']);

		expect(stdout).toContain('<profile>');
	});

	it('refuses to remove the default profile', async () => {
		const { stderr, exitCode } = await runCli(['remove', 'default']);

		expect(stderr).toContain('Cannot remove the "default" profile');
		expect(exitCode).toBe(1);
	});

	it('fails when the profile does not exist', async () => {
		const { stderr, exitCode } = await runCli(['remove', 'ghost']);

		expect(stderr).toContain('Profile "ghost" not found');
		expect(exitCode).toBe(1);
	});
});
