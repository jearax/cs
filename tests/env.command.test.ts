import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import {
	applyEnvChange,
	buildSetKeyOptions,
	buildUnsetKeyOptions,
	ENV_KEY_PATTERN
} from '@/commands/env/services/env.service';
import { csConfigPath, profileArtifactPath } from '@/modules/profiles/constants/paths.constant';

import { runCli } from './support/cli';
import { useTempHome } from './support/temp-home';

useTempHome();

const readJson = async (path: string): Promise<Record<string, unknown>> => {
	return JSON.parse(await readFile(path, 'utf8')) as Record<string, unknown>;
};

describe('the env key', () => {
	it.each(['HTTP_PROXY', 'A', 'A_1'])('accepts %s', (key) => {
		expect(ENV_KEY_PATTERN.test(key)).toBe(true);
	});

	it.each(['http_proxy', '1HTTP', 'HTTP-PROXY', ''])('rejects %s', (key) => {
		expect(ENV_KEY_PATTERN.test(key)).toBe(false);
	});
});

describe('cs env', () => {
	it('sets a global value and rebuilds the rendered profiles', async () => {
		await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-secret-token']);

		const result = await applyEnvChange('global', undefined, 'set', 'HTTPS_PROXY', 'http://secure');

		expect(result.target).toBe('global');
		expect(result.rerendered).toContain('work');

		const config = await readJson(csConfigPath());

		expect((config['env'] as Record<string, string>)['HTTPS_PROXY']).toBe('http://secure');

		const artifact = await readJson(profileArtifactPath('work'));
		const env = artifact['env'] as Record<string, string>;

		expect(env['HTTPS_PROXY']).toBe('http://secure');
	});

	it('sets a value on one profile only', async () => {
		await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-secret-token']);

		await applyEnvChange('profile', 'work', 'set', 'HTTP_PROXY', 'http://proxy');

		const config = await readJson(csConfigPath());
		const profiles = config['profiles'] as Record<string, { env?: Record<string, string> }>;

		expect(profiles['work']?.env?.['HTTP_PROXY']).toBe('http://proxy');
		expect(profiles['default']?.env?.['HTTP_PROXY']).toBeUndefined();
	});

	it('unsets a value', async () => {
		await applyEnvChange('global', undefined, 'set', 'HTTP_PROXY', 'http://proxy');
		await applyEnvChange('global', undefined, 'unset', 'HTTP_PROXY', undefined);

		const config = await readJson(csConfigPath());

		expect((config['env'] as Record<string, string>)['HTTP_PROXY']).toBeUndefined();
	});

	it('never writes the value into the command output', async () => {
		const result = await applyEnvChange('global', undefined, 'set', 'API_KEY', 'super-secret-value');

		expect(JSON.stringify(result)).not.toContain('super-secret-value');
	});

	it('fails when the profile does not exist', async () => {
		await expect(applyEnvChange('profile', 'ghost', 'set', 'HTTP_PROXY', 'http://proxy')).rejects.toThrow(
			'Profile "ghost" not found'
		);
	});
});

describe('the env key suggestions', () => {
	it('builds the SET options from the curated catalog', () => {
		const options = buildSetKeyOptions();

		expect(options.length).toBeGreaterThan(0);
		expect(
			options.every((option) => {
				return option.label === option.value;
			})
		).toBe(true);

		const managed = options.find((option) => {
			return option.value === 'CLAUDE_CODE_DISABLE_1M_CONTEXT';
		});

		expect(managed?.hint).toContain('overrides cs');

		const plain = options.find((option) => {
			return option.value === 'CLAUDE_CODE_MAX_OUTPUT_TOKENS';
		});

		expect(plain?.hint).not.toContain('overrides cs');
	});

	it('never suggests the credential keys cs manages through profiles', () => {
		const values = buildSetKeyOptions().map((option) => {
			return option.value;
		});

		expect(values).not.toContain('ANTHROPIC_BASE_URL');
		expect(values).not.toContain('ANTHROPIC_AUTH_TOKEN');
	});

	it('builds the UNSET options from the keys actually set in the scope', async () => {
		await applyEnvChange('global', undefined, 'set', 'HTTP_PROXY', 'http://proxy');
		await applyEnvChange('profile', 'default', 'set', 'HTTPS_PROXY', 'http://secure');

		expect(
			(await buildUnsetKeyOptions('global')).map((option) => {
				return option.value;
			})
		).toEqual(['HTTP_PROXY']);
		expect(
			(await buildUnsetKeyOptions('profile', 'default')).map((option) => {
				return option.value;
			})
		).toEqual(['HTTPS_PROXY']);
	});

	it('builds no UNSET options when the scope holds no keys', async () => {
		expect(await buildUnsetKeyOptions('global')).toEqual([]);
	});
});
