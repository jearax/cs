import { describe, expect, it } from 'vitest';

import { renderProfileSettings } from '@/modules/profiles/services/render.service';

import type { Profile } from '@/modules/profiles/types/profile.type';

const baseProfile: Profile = {
	url: 'https://api.example.com',
	token: 'sk-secret-token',
	haiku: 'claude-haiku-5-5',
	sonnet: 'claude-sonnet-5-5',
	opus: 'claude-opus-5-5',
	fable: 'claude-fable-5-1'
};

const render = (profile: Profile, globalEnv: Record<string, string> = {}) => {
	return renderProfileSettings({
		profile,
		globalEnv
	});
};

describe('the settings renderer', () => {
	it('maps the seven ANTHROPIC_* fields of the profile', () => {
		const { env } = render(baseProfile);

		expect(env).toEqual({
			ANTHROPIC_BASE_URL: 'https://api.example.com',
			ANTHROPIC_AUTH_TOKEN: 'sk-secret-token',
			ANTHROPIC_DEFAULT_MODEL: 'claude-sonnet-5-5',
			ANTHROPIC_DEFAULT_HAIKU_MODEL: 'claude-haiku-5-5',
			ANTHROPIC_DEFAULT_SONNET_MODEL: 'claude-sonnet-5-5',
			ANTHROPIC_DEFAULT_OPUS_MODEL: 'claude-opus-5-5',
			ANTHROPIC_DEFAULT_FABLE_MODEL: 'claude-fable-5-1',
			CLAUDE_CODE_DISABLE_1M_CONTEXT: '1'
		});
	});

	it('returns the env keys in the explicit semantic order, extras after', () => {
		const { env } = render(
			{
				...baseProfile,
				opus: 'claude-opus-5-5[1m]',
				oauthToken: 'oauth-secret-token',
				env: {
					HTTP_PROXY: 'http://proxy',
					ZED_EXTRA: '1'
				}
			},
			{ APP_EXTRA: '2' }
		);

		expect(Object.keys(env ?? {})).toEqual([
			'ANTHROPIC_BASE_URL',
			'ANTHROPIC_AUTH_TOKEN',
			'ANTHROPIC_DEFAULT_MODEL',
			'ANTHROPIC_DEFAULT_HAIKU_MODEL',
			'ANTHROPIC_DEFAULT_SONNET_MODEL',
			'ANTHROPIC_DEFAULT_OPUS_MODEL',
			'ANTHROPIC_DEFAULT_FABLE_MODEL',
			'CLAUDE_CODE_OAUTH_TOKEN',
			'CLAUDE_CODE_DISABLE_1M_CONTEXT',
			'CLAUDE_CODE_AUTO_COMPACT_WINDOW',
			'APP_EXTRA',
			'HTTP_PROXY',
			'ZED_EXTRA'
		]);
	});

	it.each([
		['haiku', 'claude-haiku-5-5[1m]'],
		['sonnet', 'claude-sonnet-5-5[1m]'],
		['opus', 'claude-opus-5-5[1m]'],
		['fable', 'claude-fable-5-1[1m]']
	])('derives the 1M context env when %s carries the marker', (field, modelId) => {
		const { env } = render({
			...baseProfile,
			[field]: modelId
		});

		expect(env?.['CLAUDE_CODE_DISABLE_1M_CONTEXT']).toBe('0');
		expect(env?.['CLAUDE_CODE_AUTO_COMPACT_WINDOW']).toBe('1000000');
	});

	it('disables the 1M context when no model carries the marker', () => {
		const { env } = render(baseProfile);

		expect(env?.['CLAUDE_CODE_DISABLE_1M_CONTEXT']).toBe('1');
		expect(env?.['CLAUDE_CODE_AUTO_COMPACT_WINDOW']).toBeUndefined();
	});

	it('lets the global env override the derived 1M context', () => {
		const { env } = render(
			{
				...baseProfile,
				opus: 'claude-opus-5-5[1m]'
			},
			{
				CLAUDE_CODE_DISABLE_1M_CONTEXT: '1'
			}
		);

		expect(env?.['CLAUDE_CODE_DISABLE_1M_CONTEXT']).toBe('1');
	});

	it('lets the profile env win over the global env', () => {
		const { env } = render(
			{
				...baseProfile,
				env: { HTTP_PROXY: 'profile' }
			},
			{ HTTP_PROXY: 'global' }
		);

		expect(env?.['HTTP_PROXY']).toBe('profile');
	});

	it('lets the global env win over the derived defaults', () => {
		const { env } = render(baseProfile, { ANTHROPIC_BASE_URL: 'https://global.example.com' });

		expect(env?.['ANTHROPIC_BASE_URL']).toBe('https://global.example.com');
	});

	it('disables the claude.ai connectors whatever the profile holds', () => {
		expect(render(baseProfile).disableClaudeAiConnectors).toBe(true);
		expect(
			render({
				...baseProfile,
				url: '',
				token: ''
			}).disableClaudeAiConnectors
		).toBe(true);
	});

	it('renders empty values for a login mode profile', () => {
		const { env } = render({
			...baseProfile,
			url: '',
			token: ''
		});

		expect(env?.['ANTHROPIC_BASE_URL']).toBe('');
		expect(env?.['ANTHROPIC_AUTH_TOKEN']).toBe('');
	});

	it('writes the oauth token only when the profile carries one', () => {
		expect(render(baseProfile).env?.['CLAUDE_CODE_OAUTH_TOKEN']).toBeUndefined();

		const { env } = render({
			...baseProfile,
			oauthToken: 'oauth-secret-token'
		});

		expect(env?.['CLAUDE_CODE_OAUTH_TOKEN']).toBe('oauth-secret-token');
	});

	const allowedCombos: { name: string; profile: Profile }[] = [
		{
			name: 'url only',
			profile: {
				...baseProfile,
				token: ''
			}
		},
		{
			name: 'url and token',
			profile: baseProfile
		},
		{
			name: 'url and oauth token',
			profile: {
				...baseProfile,
				token: '',
				oauthToken: 'oauth-secret-token'
			}
		},
		{
			name: 'oauth token only',
			profile: {
				...baseProfile,
				url: '',
				token: '',
				oauthToken: 'oauth-secret-token'
			}
		}
	];

	it.each(allowedCombos)('renders the allowed credential combo: $name', ({ profile }) => {
		const { env } = render(profile);

		expect(env?.['ANTHROPIC_BASE_URL']).toBe(profile.url);
		expect(env?.['ANTHROPIC_AUTH_TOKEN']).toBe(profile.token);
		expect(env?.['CLAUDE_CODE_OAUTH_TOKEN']).toBe(profile.oauthToken);
	});

	it('renders both token env keys for a hand-edited profile holding both tokens', () => {
		const { env } = render({
			...baseProfile,
			oauthToken: 'oauth-secret-token'
		});

		expect(env?.['ANTHROPIC_AUTH_TOKEN']).toBe('sk-secret-token');
		expect(env?.['CLAUDE_CODE_OAUTH_TOKEN']).toBe('oauth-secret-token');
	});

	it('lets the profile env win over the oauth token', () => {
		const { env } = render(
			{
				...baseProfile,
				oauthToken: 'oauth-secret-token',
				env: { CLAUDE_CODE_OAUTH_TOKEN: 'profile' }
			},
			{}
		);

		expect(env?.['CLAUDE_CODE_OAUTH_TOKEN']).toBe('profile');
	});
});
