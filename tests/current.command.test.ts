import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { describe, expect, it } from 'vitest';

import { claudeSettingsPath, csConfigPath } from '@/modules/profiles/constants/paths.constant';

import { runCli } from './support/cli';
import { useTempHome } from './support/temp-home';

useTempHome();

const writeJson = async (path: string, data: unknown): Promise<void> => {
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, JSON.stringify(data, null, 2), { mode: 0o600 });
};

describe('cs current', () => {
	it('shows the stored current profile', async () => {
		await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-secret-token']);
		await runCli(['use', 'work']);

		const { stdout, exitCode } = await runCli(['current']);

		expect(stdout).toContain('Active: work');
		expect(stdout).toContain('https://example.com');
		expect(exitCode).toBe(0);
	});

	it('reverse-detects the profile from the global settings when none is stored', async () => {
		await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-secret-token']);

		await writeJson(csConfigPath(), {
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
					url: 'https://example.com',
					token: 'sk-secret-token',
					haiku: '',
					sonnet: '',
					opus: '',
					fable: ''
				}
			}
		});

		await writeJson(claudeSettingsPath(), {
			env: {
				ANTHROPIC_BASE_URL: 'https://example.com',
				ANTHROPIC_AUTH_TOKEN: 'sk-secret-token'
			}
		});

		const { stdout } = await runCli(['current']);

		expect(stdout).toContain('Active: work');
	});

	it('reports that no profile is active when nothing matches', async () => {
		await writeJson(csConfigPath(), {
			schemaVersion: 3,
			profiles: {
				default: {
					url: 'https://api.anthropic.com',
					token: '',
					haiku: '',
					sonnet: '',
					opus: '',
					fable: ''
				}
			}
		});

		const { stdout, exitCode } = await runCli(['current']);

		expect(stdout).toContain('No active profile detected');
		expect(exitCode).toBe(0);
	});

	it('shows the default profile on a fresh install', async () => {
		const { stdout } = await runCli(['current']);

		expect(stdout).toContain('Active: default');
	});

	it('lists the profiles that have a rendered file', async () => {
		await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-secret-token']);

		const { stdout } = await runCli(['current']);

		expect(stdout).toContain('Rendered profiles: work');
	});
});
