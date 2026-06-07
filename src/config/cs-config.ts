import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'

import { dirname } from 'pathe'

import { CS_CONFIG_PATH, OFFICIAL_PROFILE } from '@/config/defaults'
import { ModelsCache, Profile, ThirdPartyModel } from '@/config/types'
import { safeJsonParse } from '@/utils/validation'

/** Full cs.json config shape */
export interface CsConfig {
	claude: Record<string, Profile>
	opencode: Record<string, unknown>
	currentProfile?: string
	env?: {
		CS_API_KEY?: string
	}
	modelsCache?: ModelsCache
	thirdPartyModels?: Record<string, ThirdPartyModel>
}

/** Build initial config with default profile */
const createInitialConfig = (): CsConfig => ({
	claude: { default: { ...OFFICIAL_PROFILE } },
	opencode: {},
	currentProfile: 'default'
})

/** Read cs.json — creates with default profile if missing or corrupted */
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

	return parsed
}

/** Write cs.json (mkdir -p, mode 0o600 for security) */
export const saveCsConfig = (config: CsConfig): void => {
	const dir = dirname(CS_CONFIG_PATH)

	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true })
	}

	writeFileSync(CS_CONFIG_PATH, JSON.stringify(config, null, 2), { mode: 0o600 })
}

/** Get a claude profile by name, undefined if not found */
export const getProfile = (name: string): Profile | undefined => loadCsConfig().claude[name]

/** Resolve API key from shell env first, then cs.json env */
export const resolveCsApiKeyFromSources = (shellKey?: string, configKey?: string): string | undefined => {
	const fromShell = shellKey?.trim()

	if (fromShell) {
		return fromShell
	}

	const fromConfig = configKey?.trim()

	return fromConfig || undefined
}

/** Resolve CS API key used to fetch remote models */
export const resolveCsApiKey = (): string | undefined => {
	const config = loadCsConfig()

	return resolveCsApiKeyFromSources(process.env.CS_API_KEY, config.env?.CS_API_KEY)
}

/** Save CS API key into cs.json env block */
export const saveCsApiKey = (key: string): void => {
	const config = loadCsConfig()

	config.env = {
		...config.env,
		CS_API_KEY: key
	}
	saveCsConfig(config)
}

/** Remove CS API key from cs.json env block */
export const removeCsApiKey = (): boolean => {
	const config = loadCsConfig()

	if (!config.env?.CS_API_KEY) {
		return false
	}

	delete config.env.CS_API_KEY
	saveCsConfig(config)
	return true
}

/** Normalize missing or malformed models cache into an empty cache */
export const getModelsCacheFromConfig = (config: Pick<CsConfig, 'modelsCache'>): ModelsCache => {
	const cache = config.modelsCache

	if (!cache || !cache.models || Array.isArray(cache.models) || typeof cache.models !== 'object') {
		return { models: {} }
	}

	return cache
}

/** Read cached remote models */
export const getModelsCache = (): ModelsCache => getModelsCacheFromConfig(loadCsConfig())

/** Persist cached remote models */
export const saveModelsCache = (cache: ModelsCache): void => {
	const config = loadCsConfig()

	config.modelsCache = cache
	saveCsConfig(config)
}

/** Persist the profile selected by `cs use` */
export const setCurrentProfile = (name: string): boolean => {
	const config = loadCsConfig()

	if (!config.claude[name]) {
		return false
	}

	config.currentProfile = name
	saveCsConfig(config)
	return true
}

/** Get persisted current profile name if it still exists */
export const getCurrentProfileName = (): string | undefined => {
	const config = loadCsConfig()
	const name = config.currentProfile

	return name && config.claude[name] ? name : undefined
}

/** Get persisted current profile with its name */
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

/** Get all profile names */
export const listProfileNames = (): string[] => Object.keys(loadCsConfig().claude)

/** Get all profiles as { name, ...profile } array */
export const getAllProfiles = (): (Profile & { name: string })[] => {
	const config = loadCsConfig()

	return Object.entries(config.claude).map(([name, profile]) => ({
		name,
		...profile
	}))
}

/** Partial upsert a profile — only updates provided fields */
export const upsertProfile = (name: string, partial: Partial<Profile>): void => {
	const config = loadCsConfig()
	const existing = config.claude[name] ?? { ...OFFICIAL_PROFILE }

	config.claude[name] = {
		...existing,
		...partial
	}
	saveCsConfig(config)
}

/** Remove a profile by name. Returns false if profile not found or is "default" */
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

/** Reset all profiles — keep only default, restore it to official values */
export const resetProfiles = (): string[] => {
	const config = loadCsConfig()
	const removed = Object.keys(config.claude).filter((name) => name !== 'default')

	config.claude = { default: { ...OFFICIAL_PROFILE } }
	config.currentProfile = 'default'
	delete config.thirdPartyModels
	saveCsConfig(config)
	return removed
}

/** Get all third-party model definitions */
export const getThirdPartyModels = (): Record<string, ThirdPartyModel> => {
	return loadCsConfig().thirdPartyModels ?? {}
}

/** Add or update a third-party model — unique by ID, skips if already exists */
export const upsertThirdPartyModel = (model: ThirdPartyModel): boolean => {
	const config = loadCsConfig()

	config.thirdPartyModels = config.thirdPartyModels ?? {}

	if (config.thirdPartyModels[model.id]) {
		return false // already exists, skip
	}

	config.thirdPartyModels[model.id] = model
	saveCsConfig(config)
	return true
}
