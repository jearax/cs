import { readFile } from 'node:fs/promises';
import { stripVTControlCharacters } from 'node:util';

import { describe, expect, it } from 'vitest';

import { csConfigPath, launcherPath, profileArtifactPath } from '@/modules/profiles/constants/paths.constant';

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

describe('cs config', () => {
	it('declares every paired option long-first in its help', async () => {
		// The live defaults read the current default record, so it must carry a token here.
		await runCli(['config', '-t', 'sk-seed-token']);

		const { stdout } = await runCli(['config', '--help']);

		const help = stripVTControlCharacters(stdout);

		expect(help).toContain('--name, -n <name>');
		expect(help).toContain('--url, -u <url>');
		expect(help).toContain('--token, -t <token>');
		expect(help).toContain('--sonnet, -s <model>');
		expect(help).toContain('--opus, -o <model>');
		expect(help).toContain('--fable, -f <model>');
		expect(help).toContain('--oauth-token <token>');
		expect(help).toContain('--haiku <model>');

		const unwrapped = help.replace(/\n\s+/g, ' ');

		expect(unwrapped).toContain('Examples:');
		expect(unwrapped).toContain('Profile name (default: "default")');
		expect(unwrapped).toContain('Sonnet model (default: "claude-sonnet-5-5[1m]")');
		expect(unwrapped).toContain('API base URL (default: "https://api.anthropic.com")');
		expect(unwrapped).toContain('API token (default: "sk-seed-...oken")');
		expect(unwrapped).not.toContain('sk-seed-token');
		expect(unwrapped).toContain('Claude Code login token');
		expect(unwrapped).toContain('Sonnet model; add [1m] if the model supports it and you need it');
		expect(unwrapped).not.toContain('copied from the "default" profile on creation');
		expect(unwrapped).not.toContain('Known models');
	});

	it('shows the default profile when no flag is passed', async () => {
		const { stdout, exitCode } = await runCli(['config']);

		expect(stdout).toContain('Profile: default');
		expect(stdout).toContain('https://api.anthropic.com');
		// The default record carries no token, so no credential slot renders at all.
		expect(stdout).not.toContain('<not set>');
		expect(stdout).not.toContain('Token:');
		expect(stdout).not.toContain('Known models');
		expect(exitCode).toBe(0);
	});

	it('creates a profile from the flags', async () => {
		const { stdout, exitCode } = await runCli([
			'config',
			'-n',
			'work',
			'-u',
			'https://example.com',
			'-t',
			'sk-secret-token',
			'-s',
			'claude-sonnet-5-5'
		]);

		expect(stdout).toContain('Profile "work" created with the "default" record.');
		expect(exitCode).toBe(0);

		const config = await readJson(csConfigPath());
		const profile = (config['profiles'] as Record<string, Record<string, string>>)['work'];

		expect(profile?.['url']).toBe('https://example.com');
		expect(profile?.['token']).toBe('sk-secret-token');
		expect(profile?.['haiku']).toBe('claude-haiku-5-5[1m]');
	});

	it('prints an update flush-left: no header, so no indent', async () => {
		await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-secret-token']);

		const { stdout, exitCode } = await runCli(['config', '-n', 'work', '-f', 'claude-fable-5-2']);

		expect(stdout).toContain('Profile "work" updated.\nSettings: ');
		expect(stdout).toContain('\nCommand:  claude --settings ');
		expect(stdout).not.toMatch(/^ +\S/m);
		expect(exitCode).toBe(0);
	});

	it('names no default record when every field comes from a flag', async () => {
		const { stdout, exitCode } = await runCli([
			'config',
			'-n',
			'glm',
			'-u',
			'https://api.z.ai/api/anthropic',
			'-t',
			'sk-secret-token',
			'--haiku',
			'glm-5.3-flash',
			'-s',
			'glm-5.3-flash',
			'-o',
			'glm-5.3-flash'
		]);

		expect(stdout).toContain('Profile "glm" created.\n');
		expect(stdout).not.toContain('"default" record');
		expect(exitCode).toBe(0);
	});

	it('renders the profile artifact and no launcher', async () => {
		await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-secret-token']);

		const artifact = await readJson(profileArtifactPath('work'));
		const env = artifact['env'] as Record<string, string>;

		expect(env['ANTHROPIC_BASE_URL']).toBe('https://example.com');
		expect(env['ANTHROPIC_AUTH_TOKEN']).toBe('sk-secret-token');
		expect(artifact['disableClaudeAiConnectors']).toBe(true);

		expect(await exists(launcherPath('work'))).toBe(false);
	});

	it('prints no Launcher line and lists no bin entry', async () => {
		const { stdout } = await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-secret-token']);

		expect(stdout).not.toContain('Launcher:');
		expect(stdout).toContain('Command:  claude --settings ~/.config/cs/profiles/work.json');
	});

	it('keeps the fields that no flag touches', async () => {
		await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-secret-token']);
		await runCli(['config', '-n', 'work', '-s', 'claude-sonnet-5-5']);

		const config = await readJson(csConfigPath());
		const profile = (config['profiles'] as Record<string, Record<string, string>>)['work'];

		expect(profile?.['url']).toBe('https://example.com');
		expect(profile?.['token']).toBe('sk-secret-token');
		expect(profile?.['sonnet']).toBe('claude-sonnet-5-5');
	});

	it('mirrors opus into fable when fable is omitted', async () => {
		await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-o', 'claude-opus-5-5']);

		const config = await readJson(csConfigPath());
		const profile = (config['profiles'] as Record<string, Record<string, string>>)['work'];

		expect(profile?.['opus']).toBe('claude-opus-5-5');
		expect(profile?.['fable']).toBe('claude-opus-5-5');
	});

	it('keeps a fable model that is passed on its own', async () => {
		await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-f', 'claude-fable-5-1']);

		const config = await readJson(csConfigPath());
		const profile = (config['profiles'] as Record<string, Record<string, string>>)['work'];

		expect(profile?.['fable']).toBe('claude-fable-5-1');
	});

	it('denormalizes a claude model id and leaves other ids alone', async () => {
		await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-o', 'claude-opus-4.7', '--haiku', 'gpt-4.1']);

		const config = await readJson(csConfigPath());
		const profile = (config['profiles'] as Record<string, Record<string, string>>)['work'];

		expect(profile?.['opus']).toBe('claude-opus-4-7');
		expect(profile?.['haiku']).toBe('gpt-4.1');
	});

	it('rejects a token without a url on the record after inheritance', async () => {
		await runCli(['config', '-u', '']);

		const { stderr, exitCode } = await runCli(['config', '-n', 'work', '-t', 'sk-secret-token']);

		expect(stderr).toContain('would have a token but no URL');
		expect(stderr).toContain('-u <url>');
		expect(exitCode).toBe(1);
	});

	it('rejects an invalid profile name', async () => {
		const { stderr, exitCode } = await runCli(['config', '-n', '../escape', '-u', 'https://example.com']);

		expect(stderr).toContain('path separators');
		expect(exitCode).toBe(1);
	});

	it('masks the token when a profile is shown', async () => {
		await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-secret-token']);

		const { stdout } = await runCli(['config', '-n', 'work']);

		expect(stdout).toContain('Profile: work');
		expect(stdout).toContain('sk-secre...oken');
		expect(stdout).not.toContain('sk-secret-token');
	});

	it('creates a missing profile with the default record when shown', async () => {
		const { stdout, exitCode } = await runCli(['config', '-n', 'claude']);

		expect(stdout).toContain('Profile "claude" created with the "default" record.');
		expect(stdout).toContain('https://api.anthropic.com');
		expect(exitCode).toBe(0);

		const config = await readJson(csConfigPath());
		const profiles = config['profiles'] as Record<string, Record<string, string>>;

		expect(profiles['claude']).toEqual({
			url: 'https://api.anthropic.com',
			token: '',
			haiku: 'claude-haiku-5-5[1m]',
			sonnet: 'claude-sonnet-5-5[1m]',
			opus: 'claude-opus-5-5[1m]',
			fable: 'claude-fable-5-1[1m]'
		});

		expect(await exists(profileArtifactPath('claude'))).toBe(true);
	});

	it('refuses a show-create when the name is taken by an alias', async () => {
		await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-secret-token']);
		await runCli(['alias', 'planner', 'work']);

		const { stderr, exitCode } = await runCli(['config', '-n', 'planner']);

		expect(stderr).toContain('already used by an alias');
		expect(exitCode).toBe(1);

		const config = await readJson(csConfigPath());
		const profiles = config['profiles'] as Record<string, Record<string, string>>;

		expect(profiles['planner']).toBeUndefined();
	});

	it('writes the oauth token into the rendered env', async () => {
		const { exitCode } = await runCli(['config', '-n', 'work', '--oauth-token', 'oauth-secret-token']);

		expect(exitCode).toBe(0);

		const artifact = await readJson(profileArtifactPath('work'));
		const env = artifact['env'] as Record<string, string>;

		expect(env['CLAUDE_CODE_OAUTH_TOKEN']).toBe('oauth-secret-token');
	});

	it('accepts an oauth token without a url', async () => {
		const { stderr, exitCode } = await runCli(['config', '-n', 'work', '--oauth-token', 'oauth-secret-token']);

		expect(stderr).not.toContain('token but no URL');
		expect(exitCode).toBe(0);
	});

	it('rejects a token and an oauth token set together', async () => {
		const { stderr, exitCode } = await runCli([
			'config',
			'-n',
			'work',
			'-u',
			'https://example.com',
			'-t',
			'sk-secret-token',
			'--oauth-token',
			'oauth-secret-token'
		]);

		expect(stderr).toContain('cannot have both --token and --oauth-token');
		expect(stderr).toContain('Clear one with -t "" or --oauth-token "".');
		expect(exitCode).toBe(1);

		const config = await readJson(csConfigPath());
		const profiles = config['profiles'] as Record<string, Record<string, string>>;

		expect(profiles['work']).toBeUndefined();
	});

	it('rejects an oauth token added to a profile that already has a token', async () => {
		await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-secret-token']);

		const { stderr, exitCode } = await runCli(['config', '-n', 'work', '--oauth-token', 'oauth-secret-token']);

		expect(stderr).toContain('cannot have both --token and --oauth-token');
		expect(exitCode).toBe(1);
	});

	it('accepts the oauth token once the api token is cleared', async () => {
		await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-secret-token']);

		const { exitCode } = await runCli(['config', '-n', 'work', '-t', '', '--oauth-token', 'oauth-secret-token']);

		expect(exitCode).toBe(0);

		const artifact = await readJson(profileArtifactPath('work'));
		const env = artifact['env'] as Record<string, string>;

		expect(env['ANTHROPIC_AUTH_TOKEN']).toBe('');
		expect(env['CLAUDE_CODE_OAUTH_TOKEN']).toBe('oauth-secret-token');
	});

	it('masks the oauth token when a profile is shown', async () => {
		await runCli(['config', '-n', 'work', '--oauth-token', 'oauth-secret-token']);

		const { stdout } = await runCli(['config', '-n', 'work']);

		expect(stdout).toContain('oauth-se...oken');
		expect(stdout).not.toContain('oauth-secret-token');
	});

	it('fills creation from the default record when only a token is passed', async () => {
		await runCli(['config', '-n', 'claude', '-t', 'sk-user-key']);

		const config = await readJson(csConfigPath());
		const profile = (config['profiles'] as Record<string, Record<string, string>>)['claude'];

		expect(profile?.['url']).toBe('https://api.anthropic.com');
		expect(profile?.['token']).toBe('sk-user-key');
		expect(profile?.['sonnet']).toBe('claude-sonnet-5-5[1m]');
		expect(profile?.['fable']).toBe('claude-fable-5-1[1m]');
	});

	it('does not inherit on an update when the default record has moved on', async () => {
		await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-secret-token']);
		await runCli(['config', '-u', 'https://moved.example.com']);
		await runCli(['config', '-n', 'work', '-s', 'claude-sonnet-5-5']);

		const config = await readJson(csConfigPath());
		const profile = (config['profiles'] as Record<string, Record<string, string>>)['work'];

		expect(profile?.['url']).toBe('https://example.com');
	});

	it('creates from the live default record, not a snapshot', async () => {
		await runCli(['config', '-u', 'https://live.example.com', '-t', 'sk-live-token']);
		await runCli(['config', '-n', 'fresh', '-s', 'claude-sonnet-5-5']);

		const config = await readJson(csConfigPath());
		const profile = (config['profiles'] as Record<string, Record<string, string>>)['fresh'];

		expect(profile?.['url']).toBe('https://live.example.com');
		expect(profile?.['token']).toBe('sk-live-token');
	});

	it('fires the both-tokens guard on the inherited record', async () => {
		const { stderr, exitCode } = await runCli([
			'config',
			'-n',
			'work',
			'-t',
			'sk-secret-token',
			'--oauth-token',
			'oauth-secret-token'
		]);

		expect(stderr).toContain('cannot have both --token and --oauth-token');
		expect(exitCode).toBe(1);

		const config = await readJson(csConfigPath());
		const profiles = config['profiles'] as Record<string, Record<string, string>>;

		expect(profiles['work']).toBeUndefined();
	});
});
