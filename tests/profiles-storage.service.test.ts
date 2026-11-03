import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { csConfigBackupPath, csConfigPath } from '@/modules/profiles/constants/paths.constant';
import {
	findAliasTarget,
	findProfile,
	listAliases,
	loadCsConfig,
	removeAlias,
	removeProfile,
	resetProfiles,
	saveCsConfig,
	setAlias,
	upsertProfile
} from '@/modules/profiles/services/storage.service';

import { useTempHome } from './support/temp-home';

import type { CsConfig } from '@/modules/profiles/types/profile.type';

useTempHome();

const writeRawConfig = async (content: string): Promise<void> => {
	await mkdir(dirname(csConfigPath()), { recursive: true });
	await writeFile(csConfigPath(), content, { mode: 0o600 });
};

describe('the cs config file', () => {
	it('is created with the official default profile when it is missing', async () => {
		const { config, notices } = await loadCsConfig();

		expect(notices).toEqual([]);
		expect(config.currentProfile).toBe('default');
		expect(config.profiles['default']?.url).toBe('https://api.anthropic.com');
		expect(config.profiles['default']?.opus).toBe('claude-opus-5-5[1m]');
	});

	it('is written with the mode 0600', async () => {
		await loadCsConfig();

		const info = await stat(csConfigPath());

		expect(info.mode & 0o777).toBe(0o600);
	});

	it('migrates a v1 config and keeps a backup of it', async () => {
		await writeRawConfig(
			JSON.stringify({
				schemaVersion: 1,
				claude: {
					default: {
						url: 'https://api.anthropic.com',
						token: '',
						haiku: '',
						sonnet: '',
						opus: '',
						fable: '',
						env: {
							CLAUDE_CODE_DISABLE_1M_CONTEXT: '0',
							CLAUDE_CODE_AUTO_COMPACT_WINDOW: '1000000'
						}
					}
				}
			})
		);

		const { config } = await loadCsConfig();

		expect(config.schemaVersion).toBe(3);
		expect(config.profiles['default']?.env).toBeUndefined();

		const backup = JSON.parse(await readFile(csConfigBackupPath(), 'utf8')) as { schemaVersion?: number };

		expect(backup.schemaVersion).toBe(1);

		const info = await stat(csConfigBackupPath());

		expect(info.mode & 0o777).toBe(0o600);
	});

	it('keeps a user-set env value through the migration', async () => {
		await writeRawConfig(
			JSON.stringify({
				schemaVersion: 1,
				claude: {
					default: {
						url: '',
						token: '',
						haiku: '',
						sonnet: '',
						opus: '',
						fable: '',
						env: {
							CLAUDE_CODE_AUTO_COMPACT_WINDOW: '1000000',
							HTTP_PROXY: 'http://proxy'
						}
					}
				}
			})
		);

		const { config } = await loadCsConfig();

		expect(config.profiles['default']?.env).toEqual({ HTTP_PROXY: 'http://proxy' });
	});

	it('migrates a v2 config from the old key to the profiles key', async () => {
		await writeRawConfig(
			JSON.stringify({
				schemaVersion: 2,
				claude: {
					default: {
						url: 'https://api.anthropic.com',
						token: '',
						haiku: 'claude-haiku-5-5[1m]',
						sonnet: 'claude-sonnet-5-5[1m]',
						opus: 'claude-opus-5-5[1m]',
						fable: 'claude-fable-5-1[1m]'
					},
					work: {
						url: 'https://example.com',
						token: 'sk-secret-token',
						haiku: '',
						sonnet: '',
						opus: '',
						fable: ''
					}
				},
				currentProfile: 'work'
			})
		);

		const { config } = await loadCsConfig();

		expect(config.schemaVersion).toBe(3);
		expect(config.profiles['work']?.url).toBe('https://example.com');
		expect(config.profiles['work']?.token).toBe('sk-secret-token');
		expect(config.currentProfile).toBe('work');
		expect(findProfile(config, 'default')?.opus).toBe('claude-opus-5-5[1m]');
	});

	it('writes the migrated config under the new key and keeps the old file as the backup', async () => {
		await writeRawConfig(
			JSON.stringify({
				schemaVersion: 2,
				claude: {
					work: {
						url: 'https://example.com',
						token: 'sk-secret-token',
						haiku: '',
						sonnet: '',
						opus: '',
						fable: ''
					}
				}
			})
		);

		await loadCsConfig();

		const written = JSON.parse(await readFile(csConfigPath(), 'utf8')) as {
			schemaVersion?: number;
			profiles?: Record<string, { url: string }>;
			claude?: unknown;
		};

		expect(written.schemaVersion).toBe(3);
		expect(written.profiles?.['work']?.url).toBe('https://example.com');
		expect(written.claude).toBeUndefined();

		const backup = JSON.parse(await readFile(csConfigBackupPath(), 'utf8')) as {
			schemaVersion?: number;
			claude?: Record<string, { url: string }>;
		};

		expect(backup.schemaVersion).toBe(2);
		expect(backup.claude?.['work']?.url).toBe('https://example.com');

		const info = await stat(csConfigBackupPath());

		expect(info.mode & 0o777).toBe(0o600);
	});

	it('leaves a v3 config untouched', async () => {
		await writeRawConfig(
			JSON.stringify({
				schemaVersion: 3,
				profiles: {
					work: {
						url: 'https://example.com',
						token: 'sk-secret-token',
						haiku: '',
						sonnet: '',
						opus: '',
						fable: ''
					}
				},
				currentProfile: 'work'
			})
		);

		const { config } = await loadCsConfig();

		expect(config.schemaVersion).toBe(3);
		expect(config.profiles['work']?.url).toBe('https://example.com');

		await expect(readFile(csConfigBackupPath(), 'utf8')).rejects.toThrow();
	});

	it('replaces an unreadable config and keeps it next to the new one', async () => {
		await writeRawConfig('{ not json');

		const { config, notices } = await loadCsConfig();

		expect(config.profiles['default']?.url).toBe('https://api.anthropic.com');
		expect(notices).toHaveLength(1);

		const corrupt = await readFile(`${csConfigPath()}.corrupt`, 'utf8');

		expect(corrupt).toBe('{ not json');
	});
});

describe('the profile store', () => {
	it('merges an update into the fields that are not updated', async () => {
		const { config } = await loadCsConfig();

		upsertProfile(config, 'work', {
			url: 'https://example.com',
			token: 'sk-token'
		});
		upsertProfile(config, 'work', { sonnet: 'claude-sonnet-5-5' });

		expect(findProfile(config, 'work')).toMatchObject({
			url: 'https://example.com',
			token: 'sk-token',
			sonnet: 'claude-sonnet-5-5',
			haiku: ''
		});
	});

	it('starts a new profile blank', async () => {
		const { config } = await loadCsConfig();

		upsertProfile(config, 'work', { url: 'https://example.com' });

		expect(findProfile(config, 'work')).toEqual({
			url: 'https://example.com',
			token: '',
			haiku: '',
			sonnet: '',
			opus: '',
			fable: ''
		});
	});

	it('never resolves a profile name that lives on the prototype', async () => {
		const { config } = await loadCsConfig();

		expect(findProfile(config, 'toString')).toBeUndefined();
		expect(findProfile(config, 'constructor')).toBeUndefined();
	});

	it('clears the current profile when the active one is removed', async () => {
		const { config } = await loadCsConfig();

		upsertProfile(config, 'work', { url: 'https://example.com' });
		config.currentProfile = 'work';

		expect(removeProfile(config, 'work')).toBe(true);
		expect(config.currentProfile).toBeUndefined();
	});

	it('refuses to remove the default profile', async () => {
		const { config } = await loadCsConfig();

		expect(removeProfile(config, 'default')).toBe(false);
		expect(findProfile(config, 'default')).toBeDefined();
	});

	it('keeps only the default profile on reset and restores its official values', async () => {
		const { config } = await loadCsConfig();

		upsertProfile(config, 'work', { url: 'https://example.com' });
		config.profiles['default'] = {
			url: 'https://changed',
			token: '',
			haiku: '',
			sonnet: '',
			opus: '',
			fable: ''
		};

		const removed = resetProfiles(config);

		expect(removed).toEqual(['work']);
		expect(Object.keys(config.profiles)).toEqual(['default']);
		expect(config.profiles['default']?.url).toBe('https://api.anthropic.com');
		expect(config.currentProfile).toBe('default');
	});

	it('writes the config back to disk', async () => {
		const { config } = await loadCsConfig();

		upsertProfile(config, 'work', { url: 'https://example.com' });

		await saveCsConfig(config);

		const written = JSON.parse(await readFile(csConfigPath(), 'utf8')) as CsConfig;

		expect(written.profiles['work']?.url).toBe('https://example.com');
	});

	it('keeps the config inside the cs home directory', async () => {
		await loadCsConfig();

		expect(csConfigPath()).toBe(join(process.env['HOME'] ?? '', '.config', 'cs', 'cs.json'));
	});
});

describe('the alias registry', () => {
	it('keeps the alias map through a load and save round trip', async () => {
		const { config } = await loadCsConfig();

		setAlias(config, 'planner', 'work');

		await saveCsConfig(config);

		const reloaded = await loadCsConfig();

		expect(reloaded.config.aliases).toEqual({ planner: 'work' });
		expect(findAliasTarget(reloaded.config, 'planner')).toBe('work');
	});

	it('never resolves an alias name that lives on the prototype', async () => {
		const { config } = await loadCsConfig();

		expect(findAliasTarget(config, 'toString')).toBeUndefined();
		expect(findAliasTarget(config, 'constructor')).toBeUndefined();
	});

	it('drops the map entry of a removed alias', async () => {
		const { config } = await loadCsConfig();

		setAlias(config, 'planner', 'work');
		setAlias(config, 'cooker', 'work');

		expect(removeAlias(config, 'planner')).toBe(true);
		expect(removeAlias(config, 'planner')).toBe(false);

		expect(listAliases(config)).toEqual([
			{
				name: 'cooker',
				profile: 'work'
			}
		]);
	});

	it('lists the aliases with their target profile', async () => {
		const { config } = await loadCsConfig();

		setAlias(config, 'planner', 'work');
		setAlias(config, 'cooker', 'default');

		expect(listAliases(config)).toEqual([
			{
				name: 'planner',
				profile: 'work'
			},
			{
				name: 'cooker',
				profile: 'default'
			}
		]);
	});
});
