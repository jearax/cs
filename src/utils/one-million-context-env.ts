import { Profile } from '@/config/types'

/** Model ID suffix that opts a profile into the 1M context window (cs marker, not part of the API model ID) */
const ONE_MILLION_CONTEXT_SUFFIX = '[1m]'

type ProfileModels = Pick<Profile, 'haiku' | 'sonnet' | 'opus' | 'fable'>

export const profileUsesOneMillionContext = (profile: ProfileModels): boolean =>
	[profile.haiku, profile.sonnet, profile.opus, profile.fable].some((id) => id?.endsWith(ONE_MILLION_CONTEXT_SUFFIX))

/** Computed on every `cs use`, never persisted, so `cs env` values override it */
export const deriveOneMillionContextEnv = (profile: ProfileModels): Record<string, string> =>
	profileUsesOneMillionContext(profile)
		? {
				CLAUDE_CODE_DISABLE_1M_CONTEXT: '0',
				CLAUDE_CODE_AUTO_COMPACT_WINDOW: '1000000'
			}
		: {
				CLAUDE_CODE_DISABLE_1M_CONTEXT: '1'
			}
