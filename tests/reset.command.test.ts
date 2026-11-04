import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import {
	claudeSettingsPath,
	csConfigPath,
	launcherPath,
	profileArtifactPath
} from '@/modules/profiles/constants/paths.constant';

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

describe('cs reset', () => {
	it('keeps only the default profile and lists the removed names', async () => {
		await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-secret-token']);

		const { stdout, exitCode } = await runCli(['reset']);

		expect(stdout).toContain('Removed profiles: work');
		expect(stdout).toContain('Reset complete. Active profile: default');
		expect(exitCode).toBe(0);

		const config = JSON.parse(await readFile(csConfigPath(), 'utf8')) as {
			profiles: Record<string, { url: string }>;
			currentProfile?: string;
		};

		expect(Object.keys(config.profiles)).toEqual(['default']);
		expect(config.profiles['default']?.url).toBe('https://api.anthropic.com');
		expect(config.currentProfile).toBe('default');
	});

	it('removes the artifacts of the profiles it removes', async () => {
		await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-secret-token']);

		await runCli(['reset']);

		expect(await exists(profileArtifactPath('work'))).toBe(false);
		expect(await exists(launcherPath('work'))).toBe(false);
	});

	it('activates the default profile in the global settings', async () => {
		await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-secret-token']);
		await runCli(['use', 'work']);

		await runCli(['reset']);

		const settings = JSON.parse(await readFile(claudeSettingsPath(), 'utf8')) as {
			env: Record<string, string>;
		};

		expect(settings.env['ANTHROPIC_BASE_URL']).toBe('https://api.anthropic.com');
	});

	it('restores the default artifact and leaves no launcher behind', async () => {
		await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-secret-token']);

		await runCli(['reset']);

		expect(await exists(profileArtifactPath('default'))).toBe(true);
		expect(await exists(launcherPath('default'))).toBe(false);
	});
});
