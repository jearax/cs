import type { Profile } from '@/modules/profiles/types/profile.type';
import type { RenderedSettings } from '@/modules/profiles/types/settings.type';

/** A cs marker on a model ID, never sent to the API. */
const ONE_MILLION_CONTEXT_SUFFIX = '[1m]';

export type RenderProfileInput = {
	profile: Profile;
	globalEnv: Record<string, string>;
};

export const profileUsesOneMillionContext = (profile: Profile): boolean => {
	return [profile.haiku, profile.sonnet, profile.opus, profile.fable].some((modelId) => {
		return modelId.endsWith(ONE_MILLION_CONTEXT_SUFFIX);
	});
};

/** Derived on every render, never persisted, so a `cs env` value overrides it. */
export const deriveOneMillionContextEnv = (profile: Profile): Record<string, string> => {
	if (profileUsesOneMillionContext(profile)) {
		return {
			CLAUDE_CODE_DISABLE_1M_CONTEXT: '0',
			CLAUDE_CODE_AUTO_COMPACT_WINDOW: '1000000'
		};
	}

	return {
		CLAUDE_CODE_DISABLE_1M_CONTEXT: '1'
	};
};

/** The semantic order of the env block; a key outside it follows, sorted alphabetically. */
const ENV_KEY_ORDER = [
	'ANTHROPIC_BASE_URL',
	'ANTHROPIC_AUTH_TOKEN',
	'ANTHROPIC_DEFAULT_MODEL',
	'ANTHROPIC_DEFAULT_HAIKU_MODEL',
	'ANTHROPIC_DEFAULT_SONNET_MODEL',
	'ANTHROPIC_DEFAULT_OPUS_MODEL',
	'ANTHROPIC_DEFAULT_FABLE_MODEL',
	'CLAUDE_CODE_OAUTH_TOKEN',
	'CLAUDE_CODE_DISABLE_1M_CONTEXT',
	'CLAUDE_CODE_AUTO_COMPACT_WINDOW'
];

const compareEnvKeys = (left: string, right: string): number => {
	const rank = (key: string): number => {
		const position = ENV_KEY_ORDER.indexOf(key);

		return position === -1 ? ENV_KEY_ORDER.length : position;
	};

	const byRank = rank(left) - rank(right);

	if (byRank !== 0) {
		return byRank;
	}

	return left < right ? -1 : left > right ? 1 : 0;
};

/**
 * The one renderer behind both delivery targets. Sources apply in order, last wins: the profile
 * fields, the derived `[1m]` defaults, then the global env and the profile env.
 */
export const renderProfileSettings = ({ profile, globalEnv }: RenderProfileInput): RenderedSettings => {
	const env = {
		ANTHROPIC_BASE_URL: profile.url,
		ANTHROPIC_AUTH_TOKEN: profile.token,
		...(profile.oauthToken === undefined || profile.oauthToken === ''
			? {}
			: { CLAUDE_CODE_OAUTH_TOKEN: profile.oauthToken }),
		ANTHROPIC_DEFAULT_MODEL: profile.sonnet,
		ANTHROPIC_DEFAULT_HAIKU_MODEL: profile.haiku,
		ANTHROPIC_DEFAULT_SONNET_MODEL: profile.sonnet,
		ANTHROPIC_DEFAULT_OPUS_MODEL: profile.opus,
		ANTHROPIC_DEFAULT_FABLE_MODEL: profile.fable,
		...deriveOneMillionContextEnv(profile),
		...globalEnv,
		...(profile.env ?? {})
	};

	return {
		env: Object.fromEntries(
			Object.entries(env).sort(([left], [right]) => {
				return compareEnvKeys(left, right);
			})
		),
		disableClaudeAiConnectors: true
	};
};
