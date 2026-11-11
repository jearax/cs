import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { stripVTControlCharacters } from 'node:util';

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
	it('removes the profile with its artifact, but no launcher of the profile ever exists', async () => {
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

	it('leaves a stray claude-<profile> launcher that cs never made', async () => {
		await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-secret-token']);
		await mkdir(dirname(launcherPath('work')), { recursive: true });
		await writeFile(launcherPath('work'), '#!/bin/sh\nexec echo stray\n', { mode: 0o755 });

		await runCli(['remove', 'work']);

		expect(await exists(launcherPath('work'))).toBe(true);
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

		expect(stdout).toContain('<profile...>');
	});

	it('refuses to remove the default profile', async () => {
		const { stderr, exitCode } = await runCli(['remove', 'default']);

		expect(stderr).toContain('Cannot remove the "default" profile');
		expect(exitCode).toBe(1);
	});

	it('removes via the rm shorthand like the full name', async () => {
		await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-secret-token']);

		const { stdout, exitCode } = await runCli(['rm', 'work']);

		expect(stdout).toContain('Profile "work" removed.');
		expect(exitCode).toBe(0);

		const { stdout: list } = await runCli(['list']);

		expect(list).not.toContain('work');
	});

	it('refuses to remove the default profile via the rm shorthand', async () => {
		const { stderr, exitCode } = await runCli(['rm', 'default']);

		expect(stderr).toContain('Cannot remove the "default" profile');
		expect(exitCode).toBe(1);
	});

	it('lists the command as remove|rm in the root help', async () => {
		const { stdout } = await runCli(['-h']);

		const help = stripVTControlCharacters(stdout).replace(/\n\s+/g, ' ');

		expect(help).toContain('remove|rm');
	});

	it('fails when the profile does not exist', async () => {
		const { stderr, exitCode } = await runCli(['remove', 'ghost']);

		expect(stderr).toContain('Profile "ghost" not found');
		expect(exitCode).toBe(1);
	});

	describe('several profiles at once', () => {
		const readProfiles = async (): Promise<Record<string, unknown>> => {
			const config = JSON.parse(await readFile(csConfigPath(), 'utf8')) as { profiles: Record<string, unknown> };

			return config.profiles;
		};

		const seed = async (...names: string[]): Promise<void> => {
			for (const name of names) {
				await runCli(['config', '-n', name, '-u', 'https://example.com', '-t', 'sk-secret-token']);
			}
		};

		it('removes every named profile with its artifact and aliases', async () => {
			await seed('a', 'b', 'c');
			await runCli(['alias', 'pa', 'a']);
			await runCli(['alias', 'pb', 'b']);

			const { stdout, exitCode } = await runCli(['rm', 'a', 'b']);

			expect(stdout).toBe('Profile "a" removed.\nRemoved aliases: pa\nProfile "b" removed.\nRemoved aliases: pb\n');
			expect(exitCode).toBe(0);

			const profiles = await readProfiles();

			expect(Object.keys(profiles).sort()).toEqual(['c', 'default']);
			expect(await exists(profileArtifactPath('a'))).toBe(false);
			expect(await exists(profileArtifactPath('b'))).toBe(false);
			expect(await exists(launcherPath('pa'))).toBe(false);
			expect(await exists(launcherPath('pb'))).toBe(false);
		});

		it('removes nothing when one name is unknown', async () => {
			await seed('a', 'b');

			const { stderr, exitCode } = await runCli(['rm', 'a', 'ghost', 'b']);

			expect(stderr).toContain('Profile "ghost" not found');
			expect(exitCode).toBe(1);
			expect(Object.keys(await readProfiles()).sort()).toEqual(['a', 'b', 'default']);
			expect(await exists(profileArtifactPath('a'))).toBe(true);
		});

		it('removes nothing when default is among the names', async () => {
			await seed('a');

			const { stderr, exitCode } = await runCli(['rm', 'a', 'default']);

			expect(stderr).toContain('Cannot remove the "default" profile');
			expect(exitCode).toBe(1);
			expect(Object.keys(await readProfiles()).sort()).toEqual(['a', 'default']);
		});

		it('removes a name given twice once', async () => {
			await seed('a');

			const { stdout, exitCode } = await runCli(['rm', 'a', 'a']);

			expect(stdout).toBe('Profile "a" removed.\n');
			expect(exitCode).toBe(0);
		});
	});
});
