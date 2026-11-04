import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { csConfigPath } from '@/modules/profiles/constants/paths.constant';
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

	it('is created with schema version 1', async () => {
		const { config } = await loadCsConfig();

		expect(config.schemaVersion).toBe(1);

		const written = JSON.parse(await readFile(csConfigPath(), 'utf8')) as CsConfig;

		expect(written.schemaVersion).toBe(1);
	});

	it('reads a file that keeps the profiles under the profiles key as it is', async () => {
		const content = JSON.stringify({
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
		});

		await writeRawConfig(content);

		const { config, notices } = await loadCsConfig();

		expect(notices).toEqual([]);
		expect(config.profiles['work']?.url).toBe('https://example.com');
		expect(config.profiles['work']?.token).toBe('sk-secret-token');
		expect(config.currentProfile).toBe('work');

		expect(await readFile(csConfigPath(), 'utf8')).toBe(content);
		await expect(stat(join(dirname(csConfigPath()), 'cs.json.bak'))).rejects.toThrow();
		await expect(stat(`${csConfigPath()}.corrupt`)).rejects.toThrow();
	});

	it('restamps a stale schema version to 1 on the next write', async () => {
		await writeRawConfig(
			JSON.stringify({
				schemaVersion: 3,
				profiles: {
					work: {
						url: 'https://example.com',
						token: '',
						haiku: '',
						sonnet: '',
						opus: '',
						fable: ''
					}
				}
			})
		);

		const { config } = await loadCsConfig();

		expect(config.schemaVersion).toBe(1);

		await saveCsConfig(config);

		const written = JSON.parse(await readFile(csConfigPath(), 'utf8')) as CsConfig;

		expect(written.schemaVersion).toBe(1);
	});

	it('keeps the env of a profile as it is', async () => {
		await writeRawConfig(
			JSON.stringify({
				schemaVersion: 1,
				profiles: {
					work: {
						url: 'https://example.com',
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

		expect(config.profiles['work']?.env).toEqual({
			CLAUDE_CODE_AUTO_COMPACT_WINDOW: '1000000',
			HTTP_PROXY: 'http://proxy'
		});
	});

	it('does not migrate a file that keeps the profiles under the old key', async () => {
		const content = JSON.stringify({
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
		});

		await writeRawConfig(content);

		const { config, notices } = await loadCsConfig();

		expect(notices).toHaveLength(1);
		expect(Object.keys(config.profiles)).toEqual(['default']);

		const kept = await readFile(`${csConfigPath()}.corrupt`, 'utf8');

		expect(JSON.parse(kept)).toEqual(JSON.parse(content));
		await expect(stat(join(dirname(csConfigPath()), 'cs.json.bak'))).rejects.toThrow();
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

	it('saves profile records in canonical field order', async () => {
		const { config } = await loadCsConfig();

		upsertProfile(config, 'full', {
			url: 'https://example.com',
			token: 'sk-token',
			oauthToken: 'oauth-secret-token',
			env: { HTTP_PROXY: 'http://proxy' }
		});
		upsertProfile(config, 'no-oauth', {
			url: 'https://example.com',
			token: 'sk-token',
			env: { HTTP_PROXY: 'http://proxy' }
		});
		upsertProfile(config, 'bare', {
			url: 'https://example.com',
			token: 'sk-token'
		});

		await saveCsConfig(config);

		const saved = JSON.parse(await readFile(csConfigPath(), 'utf8')) as {
			profiles: Record<string, Record<string, unknown>>;
		};

		expect(Object.keys(saved.profiles['full'] ?? {})).toEqual([
			'url',
			'token',
			'oauthToken',
			'haiku',
			'sonnet',
			'opus',
			'fable',
			'env'
		]);
		expect(Object.keys(saved.profiles['no-oauth'] ?? {})).toEqual([
			'url',
			'token',
			'haiku',
			'sonnet',
			'opus',
			'fable',
			'env'
		]);
		expect(Object.keys(saved.profiles['bare'] ?? {})).toEqual(['url', 'token', 'haiku', 'sonnet', 'opus', 'fable']);
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
