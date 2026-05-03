import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'

import { dirname } from 'pathe'

import { TOOL_SETTINGS_PATHS, getProviderPrefix } from '@/config/defaults'
import { Profile } from '@/config/types'
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

/** Generate opencode section from claude profile */
export const generateOpenCodeSection = (profile: Profile, pkgName: string): Record<string, unknown> => {
	const prefix = getProviderPrefix(pkgName)

	// Deduplicate models
	const uniqueModels = [...new Set([profile.haiku, profile.sonnet, profile.opus])]
	const models: Record<string, Record<string, unknown>> = {}

	for (const model of uniqueModels) {
		models[model] = {}
	}

	const options: Record<string, unknown> = {
		baseURL: ensureV1Suffix(profile.url),
		apiKey: profile.token
	}

	return {
		provider: {
			[prefix]: {
				name: pkgName,
				npm: '@ai-sdk/anthropic',
				options,
				models
			}
		}
	}
}

/** Deep merge opencode section into existing config */
export const mergeOpenCodeConfig = (config: Record<string, unknown>, section: Record<string, unknown>): void => {
	// Deep merge provider block
	const existingProvider = (config.provider as Record<string, unknown>) ?? {}
	const newProvider = (section.provider as Record<string, unknown>) ?? {}

	for (const [key, value] of Object.entries(newProvider)) {
		existingProvider[key] = value
	}

	config.provider = existingProvider

	// Update model
	if (section.model) {
		config.model = section.model
	}
}
