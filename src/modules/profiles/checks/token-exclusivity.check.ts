import { isEmptyToken } from '@/modules/profiles/checks/login-mode.check';

/** One profile carries one credential: an api token and an oauth token exclude each other. */
export const hasBothTokens = (profile: { token: string; oauthToken?: string }): boolean => {
	return !isEmptyToken(profile.token) && !isEmptyToken(profile.oauthToken);
};

export const BOTH_TOKENS_HINT = 'Clear one with -t "" or --oauth-token "".';
