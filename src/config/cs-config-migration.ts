import { CsConfig } from '@/config/cs-config'

/**
 * Schema history:
 * - 1 (implicit, no field): `cs config` persisted `[1m]` auto-env into each `profile.env`
 * - 2: auto-env is derived at `cs use` time; `profile.env` holds only user-set values
 */
export const CURRENT_CS_CONFIG_SCHEMA_VERSION = 2

const isLegacyAutoEnvEntry = (key: string, value: string): boolean =>
	key === 'CLAUDE_CODE_DISABLE_1M_CONTEXT' || (key === 'CLAUDE_CODE_AUTO_COMPACT_WINDOW' && value === '1000000')

/**
 * Mutates in place; returns true when the caller must save.
 * Legacy auto-env left in `profile.env` would override the use-time `[1m]` defaults.
 */
export const migrateCsConfig = (config: CsConfig): boolean => {
	if ((config.schemaVersion ?? 1) >= CURRENT_CS_CONFIG_SCHEMA_VERSION) {
		return false
	}

	for (const profile of Object.values(config.claude)) {
		if (!profile.env) {
			continue
		}

		const userEnv = Object.fromEntries(
			Object.entries(profile.env).filter(([key, value]) => !isLegacyAutoEnvEntry(key, value))
		)

		if (Object.keys(userEnv).length > 0) {
			profile.env = userEnv
		} else {
			delete profile.env
		}
	}

	config.schemaVersion = CURRENT_CS_CONFIG_SCHEMA_VERSION
	return true
}
