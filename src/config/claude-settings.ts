import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'

import { dirname } from 'pathe'

import { TOOL_SETTINGS_PATHS } from '@/config/defaults'
import { Profile, ClaudeSettings, ClaudeEnv } from '@/config/types'
import { resolveTokenForWrite } from '@/utils/format'
import { deriveOneMillionContextEnv } from '@/utils/one-million-context-env'
import { safeJsonParse } from '@/utils/validation'

/** Returns {} when missing or corrupted */
export const readClaudeSettings = (): ClaudeSettings => {
	if (!existsSync(TOOL_SETTINGS_PATHS.claude)) {
		return {}
	}

	const content = readFileSync(TOOL_SETTINGS_PATHS.claude, 'utf-8')
	const parsed = safeJsonParse<ClaudeSettings>(content, TOOL_SETTINGS_PATHS.claude)

	return parsed ?? {}
}

export const writeClaudeSettings = (settings: ClaudeSettings): void => {
	const dir = dirname(TOOL_SETTINGS_PATHS.claude)

	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true })
	}

	writeFileSync(TOOL_SETTINGS_PATHS.claude, JSON.stringify(settings, null, 2), { mode: 0o600 })
}

/**
 * Replace settings.env with cs-managed keys (sync semantics, not merge).
 *
 * Sources (in order, last wins):
 * - 7 ANTHROPIC_* fields (from profile)
 * - `[1m]` defaults derived from the profile models
 * - extraEnv (from cs.json global env + profile env), so user-set values win
 *
 * Keys a previous profile wrote are dropped, keeping profiles isolated.
 */
export const mergeClaudeSettings = (
	settings: ClaudeSettings,
	profile: Profile,
	extraEnv: Record<string, string> = {}
): void => {
	settings.env = {
		ANTHROPIC_BASE_URL: profile.url,
		ANTHROPIC_AUTH_TOKEN: resolveTokenForWrite(profile.token),
		ANTHROPIC_DEFAULT_MODEL: profile.sonnet,
		ANTHROPIC_DEFAULT_HAIKU_MODEL: profile.haiku,
		ANTHROPIC_DEFAULT_SONNET_MODEL: profile.sonnet,
		ANTHROPIC_DEFAULT_OPUS_MODEL: profile.opus,
		ANTHROPIC_DEFAULT_FABLE_MODEL: profile.fable,
		...deriveOneMillionContextEnv(profile),
		...extraEnv
	} satisfies ClaudeEnv
}

const CONNECTORS_SETTING_KEY = 'disableClaudeAiConnectors'

/** cs always disables claude.ai connectors, whatever auth mode the profile uses */
export const syncConnectorSettings = (settings: ClaudeSettings, ownedKeys: string[]): string[] => {
	settings[CONNECTORS_SETTING_KEY] = true

	return ownedKeys.includes(CONNECTORS_SETTING_KEY) ? ownedKeys : [...ownedKeys, CONNECTORS_SETTING_KEY]
}
