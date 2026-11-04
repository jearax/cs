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

/**
 * The one renderer behind both delivery targets: the global settings.json and the profile
 * artifact. Sources, in order, last wins: the seven ANTHROPIC_* fields, the oauth token, the
 * derived `[1m]` defaults, then the global env and the profile env. The env keys are returned
 * in alphabetical order.
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
				return left < right ? -1 : left > right ? 1 : 0;
			})
		),
		disableClaudeAiConnectors: true
	};
};
