import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import { claudeSettingsPath, launcherPath, profileArtifactPath } from '@/modules/profiles/constants/paths.constant';

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

describe('the profile flow', () => {
	it('goes from a new profile to a rendered artifact, a launcher and a clean removal', async () => {
		const created = await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-secret-token']);

		expect(created.exitCode).toBe(0);

		const used = await runCli(['use', 'work']);

		expect(used.exitCode).toBe(0);
		expect(used.stdout).toContain('Switched to profile "work".');
		expect(used.stdout).toContain('claude --settings ~/.config/cs/profiles/work.json');

		expect(await exists(profileArtifactPath('work'))).toBe(true);
		expect(await exists(launcherPath('work'))).toBe(true);
		expect(await exists(claudeSettingsPath())).toBe(true);

		const artifact = JSON.parse(await readFile(profileArtifactPath('work'), 'utf8')) as {
			env: Record<string, string>;
			disableClaudeAiConnectors: boolean;
		};

		expect(artifact.env['ANTHROPIC_BASE_URL']).toBe('https://example.com');
		expect(artifact.env['ANTHROPIC_AUTH_TOKEN']).toBe('sk-secret-token');
		expect(artifact.disableClaudeAiConnectors).toBe(true);

		const current = await runCli(['current']);

		expect(current.stdout).toContain('Rendered profiles: work');

		const removed = await runCli(['remove', 'work']);

		expect(removed.exitCode).toBe(0);
		expect(await exists(profileArtifactPath('work'))).toBe(false);
		expect(await exists(launcherPath('work'))).toBe(false);
	});

	it('hands the profile to the global settings', async () => {
		await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-secret-token']);

		const used = await runCli(['use', 'work']);

		expect(used.exitCode).toBe(0);

		const settings = JSON.parse(await readFile(claudeSettingsPath(), 'utf8')) as {
			env: Record<string, string>;
		};

		expect(settings.env['ANTHROPIC_BASE_URL']).toBe('https://example.com');
		expect(settings.env['ANTHROPIC_AUTH_TOKEN']).toBe('sk-secret-token');
	});
});
