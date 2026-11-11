import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

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

const readJson = async (path: string): Promise<Record<string, unknown>> => {
	return JSON.parse(await readFile(path, 'utf8')) as Record<string, unknown>;
};

const exists = async (path: string): Promise<boolean> => {
	try {
		await readFile(path);

		return true;
	} catch {
		return false;
	}
};

const seedProfile = async (): Promise<void> => {
	await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-secret-token']);
};

describe('cs use', () => {
	it('prints the profile lines flush-left under its banner', async () => {
		await seedProfile();

		const { stdout } = await runCli(['use', 'work']);

		expect(stdout).toContain('Switched to profile "work".\nURL:    https://example.com\n');
		expect(stdout).toContain('\nSettings: ');
		expect(stdout).toContain('\nCommand:  claude --settings ');
		expect(stdout).not.toMatch(/^ +\S/m);
	});

	it('writes the global settings and renders the artifacts', async () => {
		await seedProfile();

		const { stdout, exitCode } = await runCli(['use', 'work']);

		expect(stdout).toContain('Switched to profile "work".');
		expect(exitCode).toBe(0);

		const settings = await readJson(claudeSettingsPath());
		const env = settings['env'] as Record<string, string>;

		expect(env['ANTHROPIC_BASE_URL']).toBe('https://example.com');
		expect(env['ANTHROPIC_AUTH_TOKEN']).toBe('sk-secret-token');
		expect(settings['disableClaudeAiConnectors']).toBe(true);

		const config = await readJson(csConfigPath());

		expect(config['currentProfile']).toBe('work');

		expect(await exists(profileArtifactPath('work'))).toBe(true);
		expect(await exists(launcherPath('work'))).toBe(false);
	});

	it('replaces the whole env block so a profile inherits nothing', async () => {
		await seedProfile();
		await runCli(['use', 'work']);

		const settings = await readJson(claudeSettingsPath());
		const env = settings['env'] as Record<string, string>;

		expect(env['HTTP_PROXY']).toBeUndefined();
	});

	it('names the missing argument as a profile', async () => {
		const { stderr, exitCode } = await runCli(['use']);

		expect(stderr).toContain("missing required argument 'profile'");
		expect(exitCode).toBe(1);
	});

	it('shows the profile placeholder in its help', async () => {
		const { stdout } = await runCli(['use', '--help']);

		expect(stdout).toContain('<profile>');
	});

	it('fails when the profile does not exist', async () => {
		const { stderr, exitCode } = await runCli(['use', 'ghost']);

		expect(stderr).toContain('Profile "ghost" not found');
		expect(exitCode).toBe(1);
	});

	it('fails on an invalid profile name', async () => {
		const { stderr, exitCode } = await runCli(['use', 'bad name']);

		expect(stderr).toContain('Profile name can only contain');
		expect(exitCode).toBe(1);
	});

	it('fails when a profile holds a token without a url', async () => {
		// A cs.json written before the `cs config` guard can still hold that shape.
		await mkdir(dirname(csConfigPath()), { recursive: true });
		await writeFile(
			csConfigPath(),
			JSON.stringify({
				schemaVersion: 3,
				profiles: {
					default: {
						url: 'https://api.anthropic.com',
						token: '',
						haiku: '',
						sonnet: '',
						opus: '',
						fable: ''
					},
					work: {
						url: '',
						token: 'sk-secret-token',
						haiku: '',
						sonnet: '',
						opus: '',
						fable: ''
					}
				}
			}),
			{ mode: 0o600 }
		);

		const { stderr, exitCode } = await runCli(['use', 'work']);

		expect(stderr).toContain('has a token but no URL');
		expect(exitCode).toBe(1);
	});
});
