import { isEmptyToken } from '@/modules/profiles/checks/login-mode.check';
import { readClaudeSettings } from '@/modules/profiles/services/claude-settings.service';
import { findProfile, getCurrentProfileName, listProfiles } from '@/modules/profiles/services/storage.service';

import type { CsConfig, NamedProfile } from '@/modules/profiles/types/profile.type';
import type { ClaudeSettings } from '@/modules/profiles/types/settings.type';

/** The active profile is reverse-detected from the URL and the token of the global settings. */
export const detectActiveProfile = (settings: ClaudeSettings, profiles: NamedProfile[]): NamedProfile | null => {
	const env = settings.env;

	if (!env) {
		return null;
	}

	const url = env.ANTHROPIC_BASE_URL;

	for (const profile of profiles) {
		if (profile.url !== url) {
			continue;
		}

		// An oauth-only profile has no URL to differ by (decision 0008), so its oauth token alone
		// identifies it — never the both-empty rule below.
		if (isEmptyToken(profile.url)) {
			if (profile.oauthToken !== undefined && profile.oauthToken === env.CLAUDE_CODE_OAUTH_TOKEN) {
				return profile;
			}

			continue;
		}

		const token = env.ANTHROPIC_AUTH_TOKEN;

		if (isEmptyToken(profile.token) && isEmptyToken(token)) {
			return profile;
		}

		if (profile.token === token) {
			return profile;
		}
	}

	return null;
};

export const getActiveProfile = async (config: CsConfig): Promise<NamedProfile | null> => {
	const name = getCurrentProfileName(config);

	if (name !== undefined) {
		const profile = findProfile(config, name);

		if (profile !== undefined) {
			return {
				name,
				...profile
			};
		}
	}

	return detectActiveProfile(await readClaudeSettings(), listProfiles(config));
};
