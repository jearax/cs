import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'

import { dirname } from 'pathe'

import { DEFAULT_GLOBAL_ENV, TOOL_SETTINGS_PATHS } from '@/config/defaults'
import { Profile, ClaudeSettings, ClaudeEnv } from '@/config/types'
import { resolveTokenForWrite } from '@/utils/format'
import { safeJsonParse } from '@/utils/validation'

/** Read claude settings.json, return {} if missing or corrupted */
export const readClaudeSettings = (): ClaudeSettings => {
	if (!existsSync(TOOL_SETTINGS_PATHS.claude)) {
		return {}
	}

	const content = readFileSync(TOOL_SETTINGS_PATHS.claude, 'utf-8')
	const parsed = safeJsonParse<ClaudeSettings>(content, TOOL_SETTINGS_PATHS.claude)

	return parsed ?? {}
}

/** Write claude settings.json (mode 0o600 for security) */
export const writeClaudeSettings = (settings: ClaudeSettings): void => {
	const dir = dirname(TOOL_SETTINGS_PATHS.claude)

	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true })
	}

	writeFileSync(TOOL_SETTINGS_PATHS.claude, JSON.stringify(settings, null, 2), { mode: 0o600 })
}

/**
 * Merge profile fields + extraEnv into Claude settings env block.
 * Layering: DEFAULT_GLOBAL_ENV → existing settings.env → extraEnv → profile fields.
 * Existing settings.env is preserved (merge, not sync).
 *
 * When profile has no `[1m]` model suffix, CLAUDE_CODE_AUTO_COMPACT_WINDOW is
 * explicitly removed from the final env (overrides any stale value from
 * settings.env or extraEnv).
 */
export const mergeClaudeSettings = (
	settings: ClaudeSettings,
	profile: Profile,
	extraEnv: Record<string, string> = {}
): void => {
	const profileHas1m = [profile.haiku, profile.sonnet, profile.opus].some((id) => id?.endsWith('[1m]'))

	const env: ClaudeEnv = {
		...DEFAULT_GLOBAL_ENV,
		...settings.env,
		...extraEnv
	}

	// Drop stale AUTO_COMPACT_WINDOW when no [1m] suffix in profile
	if (!profileHas1m) {
		delete env.CLAUDE_CODE_AUTO_COMPACT_WINDOW
	}

	settings.env = env

	env.ANTHROPIC_BASE_URL = profile.url
	env.ANTHROPIC_AUTH_TOKEN = resolveTokenForWrite(profile.token)
	env.ANTHROPIC_DEFAULT_HAIKU_MODEL = profile.haiku
	env.ANTHROPIC_DEFAULT_SONNET_MODEL = profile.sonnet
	env.ANTHROPIC_DEFAULT_OPUS_MODEL = profile.opus
}
