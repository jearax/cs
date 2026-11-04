import { describe, expect, it } from 'vitest';

import { detectActiveProfile } from '@/modules/profiles/services/active-profile.service';

import type { NamedProfile } from '@/modules/profiles/types/profile.type';
import type { ClaudeSettings } from '@/modules/profiles/types/settings.type';

const apiProfile: NamedProfile = {
	name: 'work',
	url: 'https://work.example.com',
	token: 'sk-work-token',
	haiku: '',
	sonnet: '',
	opus: '',
	fable: ''
};

const oauthProfile: NamedProfile = {
	name: 'oauth',
	url: '',
	token: '',
	haiku: '',
	sonnet: '',
	opus: '',
	fable: '',
	oauthToken: 'oauth-secret-token'
};

const settingsFor = (env: Record<string, string>): ClaudeSettings => {
	return { env };
};

describe('the active profile detector', () => {
	it('matches an api profile by its url and token', () => {
		const settings = settingsFor({
			ANTHROPIC_BASE_URL: 'https://work.example.com',
			ANTHROPIC_AUTH_TOKEN: 'sk-work-token'
		});

		expect(detectActiveProfile(settings, [apiProfile, oauthProfile])).toEqual(apiProfile);
	});

	it('matches an oauth-only profile by its oauth token', () => {
		const settings = settingsFor({
			ANTHROPIC_BASE_URL: '',
			ANTHROPIC_AUTH_TOKEN: '',
			CLAUDE_CODE_OAUTH_TOKEN: 'oauth-secret-token'
		});

		expect(detectActiveProfile(settings, [apiProfile, oauthProfile])).toEqual(oauthProfile);
	});

	it('does not match an oauth-only profile by a different oauth token', () => {
		const settings = settingsFor({
			ANTHROPIC_BASE_URL: '',
			ANTHROPIC_AUTH_TOKEN: '',
			CLAUDE_CODE_OAUTH_TOKEN: 'another-oauth-token'
		});

		expect(detectActiveProfile(settings, [apiProfile, oauthProfile])).toBeNull();
	});
});
