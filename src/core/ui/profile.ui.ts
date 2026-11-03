import { maskToken } from '@/core/utils/mask-token.util';

/** The fields a profile view needs; a profile satisfies it structurally. */
export type ProfileView = {
	url: string;
	token: string;
	haiku: string;
	sonnet: string;
	opus: string;
	fable: string;
	oauthToken?: string;
};

export const profileFieldLines = (profile: ProfileView): string[] => {
	return [
		`  URL:    ${profile.url}`,
		`  Token:  ${maskToken(profile.token)}`,
		`  OAuth:  ${maskToken(profile.oauthToken ?? '')}`,
		`  Haiku:  ${profile.haiku}`,
		`  Sonnet: ${profile.sonnet}`,
		`  Opus:   ${profile.opus}`,
		`  Fable:  ${profile.fable}`
	];
};

export const profileHeadingLines = (label: string, name: string, profile: ProfileView): string[] => {
	return [`${label}: ${name}`, ...profileFieldLines(profile)];
};
