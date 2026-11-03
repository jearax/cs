/** A token without a URL would be sent to the official API instead of the `/login` flow: rejected. */
export const hasTokenWithoutUrl = (profile: { url: string; token: string }): boolean => {
	return !profile.url && !!profile.token;
};

export const isEmptyToken = (token: string | undefined): boolean => {
	return !token;
};

export const TOKEN_WITHOUT_URL_HINT =
	'Set a URL with -u <url>, or clear the token with -t "" to use Claude Code login.';
