import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'

import { dirname } from 'pathe'

import { CURRENT_CS_CONFIG_SCHEMA_VERSION, migrateCsConfig } from '@/config/cs-config-migration'
import { CS_CONFIG_PATH, OFFICIAL_PROFILE } from '@/config/defaults'
import { Profile } from '@/config/types'
import { safeJsonParse } from '@/utils/validation'

export interface CsConfig {
	schemaVersion?: number
	claude: Record<string, Profile>
	currentProfile?: string
	env?: Record<string, string>
	/** Top-level settings.json keys cs added itself; only these may be removed by cs */
	ownedClaudeSettingsKeys?: string[]
}

const createInitialConfig = (): CsConfig => ({
	schemaVersion: CURRENT_CS_CONFIG_SCHEMA_VERSION,
	claude: { default: { ...OFFICIAL_PROFILE } },
	currentProfile: 'default'
})

/** Keep the pre-migration file next to cs.json so a user can recover hand-set values */
const backupCsConfig = (): void => {
	const backupPath = `${CS_CONFIG_PATH}.bak`

	copyFileSync(CS_CONFIG_PATH, backupPath)
	chmodSync(backupPath, 0o600)
}

/** Recreates the default config when missing or corrupted */
export const loadCsConfig = (): CsConfig => {
	if (!existsSync(CS_CONFIG_PATH)) {
		const initial = createInitialConfig()

		saveCsConfig(initial)
		return initial
	}

	const content = readFileSync(CS_CONFIG_PATH, 'utf-8')
	const parsed = safeJsonParse<CsConfig>(content, CS_CONFIG_PATH)

	if (!parsed) {
		const initial = createInitialConfig()

		saveCsConfig(initial)
		return initial
	}

	if (migrateCsConfig(parsed)) {
		backupCsConfig()
		saveCsConfig(parsed)
	}

	return parsed
}

export const saveCsConfig = (config: CsConfig): void => {
	const dir = dirname(CS_CONFIG_PATH)

	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true })
	}

	writeFileSync(CS_CONFIG_PATH, JSON.stringify(config, null, 2), { mode: 0o600 })
}

/** Own-property lookup so names like "toString" never resolve to Object.prototype members */
export const findProfile = (config: CsConfig, name: string): Profile | undefined =>
	Object.hasOwn(config.claude, name) ? config.claude[name] : undefined

export const getProfile = (name: string): Profile | undefined => findProfile(loadCsConfig(), name)

/** Undefined when the stored profile has since been removed */
export const getCurrentProfileName = (): string | undefined => {
	const config = loadCsConfig()
	const name = config.currentProfile

	return name && config.claude[name] ? name : undefined
}

export const getCurrentProfile = (): (Profile & { name: string }) | undefined => {
	const config = loadCsConfig()
	const name = config.currentProfile
	const profile = name ? config.claude[name] : undefined

	return name && profile
		? {
				name,
				...profile
			}
		: undefined
}

export const listProfileNames = (): string[] => Object.keys(loadCsConfig().claude)

export const getAllProfiles = (): (Profile & { name: string })[] => {
	const config = loadCsConfig()

	return Object.entries(config.claude).map(([name, profile]) => ({
		name,
		...profile
	}))
}

export const upsertProfile = (name: string, partial: Partial<Profile>): void => {
	const config = loadCsConfig()
	const existing = config.claude[name] ?? { ...OFFICIAL_PROFILE }

	config.claude[name] = {
		...existing,
		...partial
	}
	saveCsConfig(config)
}

/** Returns false when the profile is missing or is "default" */
export const removeProfile = (name: string): boolean => {
	if (name === 'default') {
		return false
	}

	const config = loadCsConfig()

	if (!config.claude[name]) {
		return false
	}

	delete config.claude[name]

	if (config.currentProfile === name) {
		delete config.currentProfile
	}

	saveCsConfig(config)
	return true
}

/** Keeps only "default", restored to official values; returns the removed names */
export const resetProfiles = (): string[] => {
	const config = loadCsConfig()
	const removed = Object.keys(config.claude).filter((name) => name !== 'default')

	config.claude = { default: { ...OFFICIAL_PROFILE } }
	config.currentProfile = 'default'
	saveCsConfig(config)
	return removed
}
