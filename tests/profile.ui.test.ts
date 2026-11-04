import { describe, expect, it } from 'vitest';

import { profileFieldLines } from '@/core/ui/profile.ui';

import type { ProfileView } from '@/core/ui/profile.ui';

const baseView = (overrides: Partial<ProfileView>): ProfileView => {
	return {
		url: '',
		token: '',
		haiku: '',
		sonnet: '',
		opus: '',
		fable: '',
		...overrides
	};
};

describe('profileFieldLines', () => {
	it('shows url and token for the api auth mode', () => {
		const lines = profileFieldLines(
			baseView({
				url: 'https://api.example.com',
				token: 'sk-secret-token-value'
			})
		);

		expect(lines.join('\n')).toContain('URL:    https://api.example.com');
		expect(lines.join('\n')).toContain('Token:  sk-secre');
		expect(lines.join('\n')).not.toContain('OAuth:');
	});

	it('shows url and oauth for the oauth auth mode', () => {
		const lines = profileFieldLines(
			baseView({
				url: 'https://api.example.com',
				oauthToken: 'oauth-secret-token'
			})
		);

		expect(lines.join('\n')).toContain('OAuth:');
		expect(lines.join('\n')).not.toContain('Token:');
	});

	it('shows the oauth token without a url', () => {
		const lines = profileFieldLines(baseView({ oauthToken: 'oauth-secret-token' }));

		expect(lines.join('\n')).not.toContain('URL:');
		expect(lines.join('\n')).toContain('OAuth:');
	});

	it('shows no credential line in login mode', () => {
		const lines = profileFieldLines(baseView({}));

		expect(lines.join('\n')).not.toContain('URL:');
		expect(lines.join('\n')).not.toContain('Token:');
		expect(lines.join('\n')).not.toContain('OAuth:');
	});

	it('always shows the model fields', () => {
		const lines = profileFieldLines(baseView({ sonnet: 'claude-sonnet-5-5' }));

		expect(lines.join('\n')).toContain('Sonnet: claude-sonnet-5-5');
	});
});
