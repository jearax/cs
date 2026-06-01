import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'

import { dirname } from 'pathe'

import { resolveCsApiKey } from '@/config/cs-config'
import { TOOL_SETTINGS_PATHS, getProviderPrefix } from '@/config/defaults'
import { Profile } from '@/config/types'
import { OpencodeModel } from '@/services/opencode-model-types'
import { resolveTokenForWrite } from '@/utils/format'
import { safeJsonParse } from '@/utils/validation'

/** Read opencode config, return {} if missing or corrupted */
export const readOpenCodeConfig = (): Record<string, unknown> => {
	if (!existsSync(TOOL_SETTINGS_PATHS.opencode)) {
		return {}
	}

	const content = readFileSync(TOOL_SETTINGS_PATHS.opencode, 'utf-8')
	const parsed = safeJsonParse<Record<string, unknown>>(content, TOOL_SETTINGS_PATHS.opencode)

	return parsed ?? {}
}

/** Write opencode config (mode 0o600 for security) */
export const writeOpenCodeConfig = (config: Record<string, unknown>): void => {
	const dir = dirname(TOOL_SETTINGS_PATHS.opencode)

	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true })
	}

	writeFileSync(TOOL_SETTINGS_PATHS.opencode, JSON.stringify(config, null, 2), { mode: 0o600 })
}

/** Ensure URL ends with /v1 for OpenCode compatibility */
const ensureV1Suffix = (url: string): string => {
	if (url.endsWith('/v1')) {
		return url
	}

	return url.endsWith('/') ? `${url}v1` : `${url}/v1`
}

/** Generate opencode section from claude profile — models managed by cs ls --sync */
export const generateOpenCodeSection = (profile: Profile, pkgName: string): Record<string, unknown> => {
	const prefix = getProviderPrefix(pkgName)
	// Prefer explicit profile token, fallback to resolved API key
	const effectiveToken = profile.token || resolveCsApiKey() || ''

	const options: Record<string, unknown> = {
		baseURL: ensureV1Suffix(profile.url),
		apiKey: resolveTokenForWrite(effectiveToken)
	}

	return {
		provider: {
			[prefix]: {
				name: pkgName,
				options
			}
		}
	}
}

/** Deep merge opencode section into existing config */
export const mergeOpenCodeModels = (
	config: Record<string, unknown>,
	models: Record<string, OpencodeModel>,
	pkgName: string
): boolean => {
	if (Object.keys(models).length === 0) {
		return false
	}

	const prefix = getProviderPrefix(pkgName)
	const provider = (config.provider as Record<string, unknown>) ?? {}
	const currentSection = (provider[prefix] as Record<string, unknown>) ?? {}

	provider[prefix] = {
		name: currentSection.name ?? pkgName,
		...currentSection,
		models
	}
	config.provider = provider
	return true
}

export const writeOpenCodeModels = (models: Record<string, OpencodeModel>, pkgName: string): boolean => {
	const config = readOpenCodeConfig()
	const changed = mergeOpenCodeModels(config, models, pkgName)

	if (changed) {
		writeOpenCodeConfig(config)
	}

	return changed
}

export const mergeOpenCodeConfig = (config: Record<string, unknown>, section: Record<string, unknown>): void => {
	// Deep merge provider block — preserve existing models
	const existingProvider = (config.provider as Record<string, unknown>) ?? {}
	const newProvider = (section.provider as Record<string, unknown>) ?? {}

	for (const [key, value] of Object.entries(newProvider)) {
		const existingSection = (existingProvider[key] as Record<string, unknown>) ?? {}
		const newSection = (value as Record<string, unknown>) ?? {}

		// Merge new fields into existing, but keep existing models intact
		existingProvider[key] = {
			...existingSection,
			...newSection,
			models: existingSection.models ?? newSection.models
		}
	}

	config.provider = existingProvider

	// Update model
	if (section.model) {
		config.model = section.model
	}
}
