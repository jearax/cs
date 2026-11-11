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

export const profileFieldLines = (profile: ProfileView, indent = '  '): string[] => {
	// Only the set credentials show, so a view carries one of the valid pairs: url+token or
	// url+oauthToken (decision 0008) — never an empty slot for the other one.
	const lines: string[] = [];

	if (profile.url !== '') {
		lines.push(`${indent}URL:    ${profile.url}`);
	}

	if (profile.token !== '') {
		lines.push(`${indent}Token:  ${maskToken(profile.token)}`);
	}

	if (profile.oauthToken !== undefined && profile.oauthToken !== '') {
		lines.push(`${indent}OAuth:  ${maskToken(profile.oauthToken)}`);
	}

	lines.push(
		`${indent}Haiku:  ${profile.haiku}`,
		`${indent}Sonnet: ${profile.sonnet}`,
		`${indent}Opus:   ${profile.opus}`,
		`${indent}Fable:  ${profile.fable}`
	);

	return lines;
};

export const profileHeadingLines = (label: string, name: string, profile: ProfileView): string[] => {
	return [`${label}: ${name}`, ...profileFieldLines(profile)];
};
