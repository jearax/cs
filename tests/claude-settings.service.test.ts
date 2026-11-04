import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { describe, expect, it } from 'vitest';

import { claudeSettingsPath } from '@/modules/profiles/constants/paths.constant';
import { readClaudeSettings, writeClaudeSettings } from '@/modules/profiles/services/claude-settings.service';

import { runCli } from './support/cli';
import { useTempHome } from './support/temp-home';

useTempHome();

const writeSettingsRaw = async (content: string): Promise<void> => {
	await mkdir(dirname(claudeSettingsPath()), { recursive: true });
	await writeFile(claudeSettingsPath(), content);
};

const seedWorkProfile = async (): Promise<void> => {
	await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-secret-token']);
};

describe('the claude settings file', () => {
	it('reads a valid file and keeps its keys', async () => {
		await writeSettingsRaw(
			JSON.stringify({
				model: 'claude-opus-5-5',
				permissions: { allow: ['Bash(ls)'] }
			})
		);

		const settings = await readClaudeSettings();

		expect(settings['model']).toBe('claude-opus-5-5');
		expect(settings['permissions']).toEqual({ allow: ['Bash(ls)'] });
	});

	it('reads a missing file as empty', async () => {
		expect(await readClaudeSettings()).toEqual({});
	});

	it('refuses a file that does not parse', async () => {
		await writeSettingsRaw('{ not json');

		await expect(readClaudeSettings()).rejects.toThrow('not valid JSON');
	});

	it('writes through a rename and leaves no temp file behind', async () => {
		await writeClaudeSettings({ model: 'claude-opus-5-5' });

		const settings = JSON.parse(await readFile(claudeSettingsPath(), 'utf8')) as { model?: string };

		expect(settings['model']).toBe('claude-opus-5-5');
		await expect(readFile(`${claudeSettingsPath()}.tmp`)).rejects.toThrow();
	});
});

describe('cs use against the claude settings file', () => {
	it('refuses and changes nothing when the settings file is corrupt', async () => {
		await seedWorkProfile();
		await writeSettingsRaw('{ not json');

		const before = await readFile(claudeSettingsPath(), 'utf8');

		const { stderr, exitCode } = await runCli(['use', 'work']);

		expect(stderr).toContain('not valid JSON');
		expect(exitCode).toBe(1);
		expect(await readFile(claudeSettingsPath(), 'utf8')).toBe(before);
	});

	it('preserves the user keys of a valid settings file', async () => {
		await seedWorkProfile();
		await writeSettingsRaw(
			JSON.stringify({
				model: 'claude-opus-5-5',
				permissions: { allow: ['Bash(ls)'] }
			})
		);

		const { exitCode } = await runCli(['use', 'work']);

		expect(exitCode).toBe(0);

		const settings = JSON.parse(await readFile(claudeSettingsPath(), 'utf8')) as {
			model?: string;
			permissions?: unknown;
			env?: Record<string, string>;
		};

		expect(settings['model']).toBe('claude-opus-5-5');
		expect(settings['permissions']).toEqual({ allow: ['Bash(ls)'] });
		expect(settings['env']?.['ANTHROPIC_BASE_URL']).toBe('https://example.com');
	});
});
