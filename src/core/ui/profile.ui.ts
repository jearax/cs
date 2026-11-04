import { maskToken } from '@/core/utils/mask-token.util';
import { KNOWN_MODELS } from '@/modules/profiles/constants/models.constant';

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

/** The suggestion under the profile fields: the curated model IDs and the 1M marker. */
export const knownModelsLine = (): string => {
	return `  Known models: ${KNOWN_MODELS.join(', ')} — append [1m] for the 1M context window`;
};
